import type { Queue, Task } from '../../entities'
import type { Database } from '../sql'
import type { Job } from 'node-schedule'
import type { Logger } from 'pino'
import { QueueRunner } from '../../helpers/queue/queue-runner'
import type { TaskRunner } from './task-runner'
import type { WrappedNodeRedisClient } from 'handy-redis'
import handyRedis from 'handy-redis'
import nodeSchedule from 'node-schedule'
import { parseExpression } from 'cron-parser'

export interface QueuerOptions {
  channel: string
  database: Database
  databases: Record<string, Database | undefined>
  logger: Logger
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

  public database: Database

  public databases: Record<string, Database | undefined>

  public job?: Job

  public lib = {
    handyRedis,
    nodeSchedule
  }

  public logger: Logger

  public names: string

  public options: Partial<QueuerOptions>

  public queue: WrappedNodeRedisClient

  public queueRead?: WrappedNodeRedisClient

  public queueRunners: Set<QueueRunner> = new Set()

  public schedule: string

  public taskRunners: Set<TaskRunner> = new Set()

  public constructor (options: Partial<QueuerOptions> = {}) {
    const {
      channel = 'queue',
      database,
      databases,
      logger,
      names = process.env.QUEUE_NAMES ?? '.',
      queue,
      schedule = process.env.QUEUE_SCHEDULE ?? '* * * * *'
    } = options

    if (database === undefined) {
      throw new Error('Database is undefined')
    }

    if (databases === undefined) {
      throw new Error('Databases are undefined')
    }

    if (logger === undefined) {
      throw new Error('Logger is undefined')
    }

    if (queue === undefined) {
      throw new Error('Queue is undefined')
    }

    this.channel = channel
    this.database = database
    this.databases = databases
    this.logger = logger.child({ name: 'queuer' })
    this.names = names
    this.queue = queue
    this.schedule = schedule
  }

  public add (taskRunner: TaskRunner): void {
    this.taskRunners.add(taskRunner)
  }

  public createRunner (): QueueRunner {
    return new QueueRunner({
      database: this.database,
      databases: this.databases,
      logger: this.logger,
      queue: this.queue
    })
  }

  public setup (): void {
    this.queueRead = this.lib.handyRedis.createNodeRedisClient(this.queue.nodeRedis.duplicate())
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

    await this.queueRead?.unsubscribe('queue')
    await this.queueRead?.quit()

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

      const queue = await connection.selectOne<Queue>(`
        SELECT
          connection,
          fkey_queue_id,
          id,
          name,
          query,
          schedule,
          schedule_begin,
          schedule_end,
          schedule_next
        FROM queue
        WHERE id = $1
      `, [
        id
      ])

      if (queue === undefined) {
        return
      }

      queue.tasks = await this.database.select<Task[]>(`
        SELECT
          fkey_queue_id,
          id,
          name,
          number,
          options
        FROM task
        WHERE fkey_queue_id = $1
      `, [
        queue.id
      ])

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
          connection,
          fkey_queue_id,
          id,
          name,
          query,
          schedule,
          schedule_begin,
          schedule_end,
          schedule_next
        FROM queue
        WHERE name ${connection.tokens.regexp} $1
        AND schedule_begin <= $2
        AND (schedule_end >= $2 OR schedule_end IS NULL)
        AND (schedule_next <= $2 OR schedule_next IS NULL)
      `, [
        this.names,
        date
      ])

      for (const queue of queues) {
        if (typeof queue.schedule === 'string') {
          await connection.update(`
            UPDATE queue
            SET schedule_next = $1
            WHERE id = $2
          `, [
            parseExpression(queue.schedule).next(),
            queue.id
          ])
        }

        queue.tasks = await connection.select<Task[]>(`
          SELECT
            fkey_queue_id,
            id,
            name,
            number,
            options
          FROM task
          WHERE fkey_queue_id = $1
        `, [
          queue.id
        ])

        await this.run(queue)
      }
    } finally {
      connection.release()
    }
  }

  protected async startListener (channel: string): Promise<void> {
    this.queueRead?.nodeRedis.on('message', (chnl, message) => {
      this
        .runListener(message)
        .catch((error: unknown) => {
          this.logger.error({ context: 'listener' }, String(error))
        })
    })

    await this.queueRead?.subscribe(channel)
  }

  protected startSchedule (schedule: string): void {
    this.job = this.lib.nodeSchedule.scheduleJob(schedule, (date) => {
      this
        .runSchedule(date)
        .catch((error: unknown) => {
          this.logger.error({ context: 'schedule' }, String(error))
        })
    })
  }
}
