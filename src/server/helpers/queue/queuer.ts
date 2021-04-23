import type { Connection, Database, UpdateResult } from '../sql'
import type { Queue, Task } from '../../entities'
import type { Job } from 'node-schedule'
import type { Logger } from 'pino'
import { QueueRunner } from '../../helpers/queue/queue-runner'
import type { TaskRunner } from './task-runner'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import { parseExpression } from 'cron-parser'
import { scheduleJob } from 'node-schedule'
import { sql } from '../sql'
import waitUntil from 'async-wait-until'

export interface QueuerOptions {
  channel?: string
  database: Database
  databases: Record<string, Database | undefined>
  highWaterMark?: number
  logger: Logger
  maxLength?: number
  names?: string
  schedule?: string
  store: WrappedNodeRedisClient
}

export interface QueuerMessage {
  id?: number
  parameters?: unknown[]
}

export class Queuer {
  public channel: string

  public database: Database

  public databases: Record<string, Database | undefined>

  public highWaterMark: number

  public job?: Job

  public logger: Logger

  public maxLength: number

  public names: string

  public queueRunners: Set<QueueRunner> = new Set()

  public schedule: string

  public store: WrappedNodeRedisClient

  public storeDuplicate?: WrappedNodeRedisClient

  public taskRunners: TaskRunner[] = []

  public constructor (options: QueuerOptions) {
    this.channel = options.channel ?? process.env.QUEUE_CHANNEL ?? 'queue'
    this.database = options.database
    this.databases = options.databases
    this.highWaterMark = options.highWaterMark ?? Number(process.env.QUEUE_HWM ?? 16)
    this.logger = options.logger.child({ name: 'queuer' })
    this.maxLength = options.maxLength ?? Number(process.env.QUEUE_MAX_LENGTH ?? 1024 * 1024)
    this.names = options.names ?? process.env.QUEUE_NAMES ?? '.'
    this.schedule = options.schedule ?? process.env.QUEUE_SCHEDULE ?? '* * * * *'
    this.store = options.store
  }

  public add (taskRunner: TaskRunner): void {
    this.taskRunners.push(taskRunner)
  }

  public createJob (name: string, callback: (date: Date) => void): Job {
    return scheduleJob(name, callback)
  }

  public createRunner (): QueueRunner {
    return new QueueRunner({
      database: this.database,
      databases: this.databases,
      highWaterMark: this.highWaterMark,
      logger: this.logger,
      maxLength: this.maxLength,
      store: this.store
    })
  }

  public createStoreDuplicate (): WrappedNodeRedisClient {
    return createNodeRedisClient(this.store.nodeRedis.duplicate())
  }

  public setup (): void {
    this.storeDuplicate = this.createStoreDuplicate()
  }

  public async start (): Promise<void> {
    this.logger.info({
      channel: this.channel,
      names: this.names,
      schedule: this.schedule
    }, 'Starting queuer')

    this.startSchedule(this.schedule)
    await this.startListener(this.channel)
  }

  public async stop (): Promise<void> {
    this.logger.info({
      connected: [
        this.store.nodeRedis.connected,
        this.storeDuplicate?.nodeRedis.connected
      ],
      queueRunners: this.queueRunners.size,
      taskRunners: this.taskRunners.length
    }, 'Stopping queuer')

    this.job?.cancel()
    await this.storeDuplicate?.unsubscribe('queue')
    await this.storeDuplicate?.quit()

    await Promise.all(this.taskRunners.map(async (taskRunner) => {
      await taskRunner.stop()
    }))

    await waitUntil(() => {
      return this.queueRunners.size === 0
    })

    await this.store.quit()
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

      if (id !== undefined) {
        const [
          queue,
          tasks
        ] = await Promise.all([
          this.selectQueue(connection, id),
          this.selectTasks(connection, id)
        ])

        if (queue !== undefined) {
          queue.tasks = tasks
          await this.run(queue, parameters)
        }
      }
    } finally {
      connection.release()
    }
  }

  protected async runSchedule (date = new Date()): Promise<void> {
    const connection = await this.database.connect()

    try {
      const queues = await this.selectQueues(connection, date)

      await Promise.all(queues.map(async (queue): Promise<void> => {
        if (queue.schedule !== null) {
          await this.updateQueue(connection, queue)
        }

        queue.tasks = await this.selectTasks(connection, queue.id)
        await this.run(queue)
      }))
    } finally {
      connection.release()
    }
  }

  protected async selectQueue (connection: Connection, id: number): Promise<Queue | undefined> {
    return connection.selectOne<Queue, Queue>(sql`
      SELECT *
      FROM queue
      WHERE id = $(id)
    `, {
      id
    })
  }

  protected async selectQueues (connection: Connection, date: Date): Promise<Queue[]> {
    return connection.select<Queue & { date: Date}, Queue[]>(sql`
      SELECT *
      FROM queue
      WHERE
        name ${connection.tokens.regexp} $(name) AND
        schedule_begin <= $(date) AND (
          schedule_end >= $(date) OR
          schedule_end IS NULL
        ) AND (
          schedule_next <= $(date) OR
          schedule_next IS NULL
        )
    `, {
      date,
      name: this.names
    })
  }

  protected async selectTasks (connection: Connection, id: number): Promise<Task[]> {
    return connection.select<Task, Task[]>(sql`
      SELECT *
      FROM task
      WHERE fkey_queue_id = $(fkey_queue_id)
      ORDER BY number ASC
    `, {
      fkey_queue_id: id
    })
  }

  protected async startListener (channel: string): Promise<void> {
    this.storeDuplicate?.nodeRedis.on('message', (ch, message) => {
      this
        .runListener(message)
        .catch((error: unknown) => {
          this.logger.error({ context: 'listener' }, String(error))
        })
    })

    await this.storeDuplicate?.subscribe(channel)
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

  protected async updateQueue (connection: Connection, queue: Queue): Promise<UpdateResult> {
    return connection.update<Queue>(sql`
      UPDATE queue
      SET schedule_next = $(schedule_next)
      WHERE id = $(id)
    `, {
      id: queue.id,
      schedule_next: parseExpression(queue.schedule ?? '')
        .next()
        .toDate()
    })
  }
}
