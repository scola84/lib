import type { Queue, Task } from '../../entities'
import type { Database } from '../sql'
import type { FastifyLoggerInstance } from 'fastify'
import type { Job } from 'node-schedule'
import type { PostgresqlDatabase } from '../sql/postgresql'
import { QueueRunner } from '../../helpers/queue/queue-runner'
import type { TaskRunner } from './task-runner'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import { parseExpression } from 'cron-parser'
import { scheduleJob } from 'node-schedule'

export interface QueuerOptions {
  channel: string
  database: PostgresqlDatabase
  databases: Record<string, Database | undefined>
  logger: FastifyLoggerInstance
  names: string
  queue: WrappedNodeRedisClient
  schedule: string
}

export interface QueuerMessage {
  id?: number
  parameters?: unknown[]
}

export class Queuer {
  public channel: string

  public database: PostgresqlDatabase

  public databases: Record<string, Database | undefined>

  public job?: Job

  public logger?: FastifyLoggerInstance

  public names: string

  public options: Partial<QueuerOptions>

  public queue: WrappedNodeRedisClient

  public queueRead: WrappedNodeRedisClient

  public queueRunners: Set<QueueRunner> = new Set()

  public schedule?: string

  public taskRunners: Set<TaskRunner> = new Set()

  public constructor (options: Partial<QueuerOptions> = {}) {
    const {
      channel = 'queue',
      database,
      databases,
      logger,
      names = '',
      queue,
      schedule
    } = options

    if (database === undefined) {
      throw new Error('Database is undefined')
    }

    if (databases === undefined) {
      throw new Error('Databases are undefined')
    }

    if (queue === undefined) {
      throw new Error('Queue is undefined')
    }

    this.channel = channel
    this.database = database
    this.databases = databases
    this.logger = logger?.child({ source: 'queuer' })
    this.names = names
    this.queue = queue
    this.queueRead = createNodeRedisClient(queue.nodeRedis.duplicate())
    this.schedule = schedule
  }

  public add (taskRunner: TaskRunner): void {
    this.taskRunners.add(taskRunner)
  }

  public async start (ids?: string): Promise<void> {
    if (this.schedule !== undefined) {
      this.startSchedule(this.schedule)
    }

    await this.startListener(this.channel)

    for (const id of ids?.split(',') ?? []) {
      await this.runListener(`{"id": ${id}}`)
    }
  }

  public async stop (): Promise<void> {
    this.job?.cancel()

    await this.queueRead.unsubscribe('queue')
    await this.queueRead.quit()

    for (const taskRunner of this.taskRunners) {
      await taskRunner.stop()
    }

    while (this.queueRunners.size > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100)
      })
    }

    await this.queue.quit()
  }

  protected async run (queue: Queue, parameters?: unknown[]): Promise<void> {
    const runner = new QueueRunner({
      database: this.database,
      databases: this.databases,
      logger: this.logger,
      queue: this.queue
    })

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

      const queue = await connection.selectOne<Queue>(`
        SELECT
          fkey_queue_id,
          id,
          connection,
          name,
          query,
          schedule,
          schedule_begin,
          schedule_end,
          schedule_next
        FROM queue
        WHERE id = $(id)
      `, {
        id
      })

      if (queue === undefined) {
        return
      }

      queue.tasks = await this.database.select<Task[]>(`
        SELECT
          fkey_queue_id,
          id,
          name,
          options,
          "order"
        FROM task
        WHERE task.fkey_queue_id = $(fkey_queue_id)
      `, {
        fkey_queue_id: queue.id
      })

      await this.run(queue, parameters)
    } finally {
      connection.release()
    }
  }

  protected async runSchedule (date = new Date()): Promise<void> {
    const connection = await this.database.connect()

    try {
      const queues = await connection.select<Queue[]>(`
        SELECT
          fkey_queue_id,
          id,
          connection,
          name,
          query,
          schedule,
          schedule_begin,
          schedule_end,
          schedule_next
        FROM queue
        WHERE name ~ $(names)
        AND schedule_begin <= $(date)
        AND (schedule_end >= $(date) OR schedule_end IS NULL)
        AND (schedule_next <= $(date) OR schedule_next IS NULL)
      `, {
        date,
        names: this.names
      })

      for (const queue of queues) {
        if (typeof queue.schedule === 'string') {
          await connection.update(`
            UPDATE queue
            SET schedule_next = $(next)
            WHERE id = $(id)
          `, {
            id: queue.id,
            next: parseExpression(queue.schedule).next()
          })
        }

        queue.tasks = await connection.select<Task[]>(`
          SELECT
            fkey_queue_id,
            id,
            name,
            options,
            "order"
          FROM task
          WHERE task.fkey_queue_id = $(fkey_queue_id)
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
    return this.queueRead
      .subscribe(channel)
      .then(() => {
        this.queueRead.nodeRedis.on('message', (chnl, message) => {
          this
            .runListener(message)
            .catch((error: unknown) => {
              this.logger?.error({ context: 'listener' }, String(error))
            })
        })
      })
  }

  protected startSchedule (schedule: string): void {
    this.job = scheduleJob(schedule, (date) => {
      this
        .runSchedule(date)
        .catch((error: unknown) => {
          this.logger?.error({ context: 'schedule' }, String(error))
        })
    })
  }
}
