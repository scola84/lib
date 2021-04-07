import type { Queue, Task } from '../../entities'
import type { Database } from '../sql'
import type { Job } from 'node-schedule'
import type { Logger } from 'pino'
import { QueueRunner } from '../../helpers/queue/queue-runner'
import type { TaskRunner } from './task-runner'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import { parseExpression } from 'cron-parser'
import { scheduleJob } from 'node-schedule'

export interface QueuerOptions {
  channel: string
  database: Database
  databases: Record<string, Database | undefined>
  logger: Logger
  names: string
  queueWriter: WrappedNodeRedisClient
  schedule: string
}

export interface QueuerMessage {
  id?: number
  parameters?: unknown[]
}

export class Queuer {
  public channel: string

  public database: Database

  public databases: Record<string, Database | undefined>

  public job?: Job

  public logger: Logger

  public names: string

  public queueReader?: WrappedNodeRedisClient

  public queueRunners: Set<QueueRunner> = new Set()

  public queueWriter: WrappedNodeRedisClient

  public schedule: string

  public taskRunners: Set<TaskRunner> = new Set()

  public constructor (options: Partial<QueuerOptions> = {}) {
    if (options.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (options.databases === undefined) {
      throw new Error('Option "databases" is undefined')
    }

    if (options.logger === undefined) {
      throw new Error('Option "logger is undefined')
    }

    if (options.queueWriter === undefined) {
      throw new Error('Option "queueWriter" is undefined')
    }

    this.channel = options.channel ?? 'queue'
    this.database = options.database
    this.databases = options.databases
    this.logger = options.logger.child({ name: 'queuer' })
    this.names = options.names ?? process.env.QUEUE_NAMES ?? '.'
    this.queueWriter = options.queueWriter
    this.schedule = options.schedule ?? process.env.QUEUE_SCHEDULE ?? '* * * * *'
  }

  public add (taskRunner: TaskRunner): void {
    this.taskRunners.add(taskRunner)
  }

  public createJob (name: string, callback: (date: Date) => void): Job {
    return scheduleJob(name, callback)
  }

  public createQueueReader (): WrappedNodeRedisClient {
    return createNodeRedisClient(this.queueWriter.nodeRedis.duplicate())
  }

  public createRunner (): QueueRunner {
    return new QueueRunner({
      database: this.database,
      databases: this.databases,
      logger: this.logger,
      queueWriter: this.queueWriter
    })
  }

  public setup (): void {
    this.queueReader = this.createQueueReader()
  }

  public async start (ids = process.env.QUEUE_IDS): Promise<void> {
    this.logger.info({
      channel: this.channel,
      names: this.names,
      schedule: this.schedule
    }, 'Starting')

    this.startSchedule(this.schedule)
    await this.startListener(this.channel)

    for (const id of ids?.split(',') ?? []) {
      await this.runListener(`{"id": ${id}}`)
    }
  }

  public async stop (): Promise<void> {
    this.logger.info('Stopping')
    this.job?.cancel()

    await this.queueReader?.unsubscribe('queue')
    await this.queueReader?.quit()

    for (const taskRunner of this.taskRunners) {
      await taskRunner.stop()
    }

    while (this.queueRunners.size > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100)
      })
    }

    await this.queueWriter.quit()
  }

  protected async run (queue: Queue, parameters?: unknown[]): Promise<void> {
    const runner = this.createRunner()
    this.queueRunners.add(runner)

    try {
      await runner.run(queue, parameters)
    } finally {
      this.queueRunners.delete(runner)
    }
  }

  protected async runListener (message: string): Promise<void> {
    const connection = await this.database.connect()

    try {
      const {
        id,
        parameters
      } = JSON.parse(message) as QueuerMessage

      if (id === undefined) {
        return
      }

      const queue = await connection.selectOne<Queue, Queue>(`
        SELECT *
        FROM queue
        WHERE id = $(id)
      `, {
        id
      })

      if (queue === undefined) {
        return
      }

      queue.tasks = await this.database.select<Queue, Task[]>(`
        SELECT *
        FROM task
        WHERE fkey_queue_id = $(id)
      `, {
        id: queue.id
      })

      await this.run(queue, parameters)
    } finally {
      connection.release()
    }
  }

  protected async runSchedule (date = new Date()): Promise<void> {
    const connection = await this.database.connect()

    try {
      const queues = await connection.select<Queue & { date: Date}, Queue[]>(`
        SELECT *
        FROM queue
        WHERE name ${connection.tokens.regexp} $(name)
        AND schedule_begin <= $(date)
        AND (schedule_end >= $(date) OR schedule_end IS NULL)
        AND (schedule_next <= $(date) OR schedule_next IS NULL)
      `, {
        date,
        name: this.names
      })

      for (const queue of queues) {
        if (typeof queue.schedule === 'string') {
          await connection.update<Queue>(`
            UPDATE queue
            SET schedule_next = $(schedule_next)
            WHERE id = $(id)
          `, {
            id: queue.id,
            schedule_next: parseExpression(queue.schedule)
              .next()
              .toDate()
          })
        }

        queue.tasks = await connection.select<Task, Task[]>(`
          SELECT *
          FROM task
          WHERE fkey_queue_id = $(fkey_queue_id)
        `, {
          fkey_queue_id: queue.id
        })

        await this.run(queue)
      }
    } finally {
      connection.release()
    }
  }

  protected async startListener (channel: string): Promise<void> {
    this.queueReader?.nodeRedis.on('message', (chnl, message) => {
      this
        .runListener(message)
        .catch((error: unknown) => {
          this.logger.error({ context: 'listener' }, String(error))
        })
    })

    await this.queueReader?.subscribe(channel)
  }

  protected startSchedule (schedule: string): void {
    this.job = this.createJob(schedule, (date) => {
      this
        .runSchedule(date)
        .catch((error: unknown) => {
          this.logger.error({ context: 'schedule' }, String(error))
        })
    })
  }
}
