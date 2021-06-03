import type { Database, UpdateResult } from '../sql'
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
  parameters?: Record<string, unknown>
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

  public createQueueRunner (): QueueRunner {
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

    this.store.nodeRedis.on('error', (error) => {
      this.logger.error({ context: 'setup' }, String(error))
    })

    this.storeDuplicate.nodeRedis.on('error', (error) => {
      this.logger.error({ context: 'setup' }, String(error))
    })
  }

  public async start (setup = true): Promise<void> {
    this.logger.info({
      channel: this.channel,
      names: this.names,
      schedule: this.schedule
    }, 'Starting queuer')

    if (setup) {
      this.setup()
    }

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
    }, {
      timeout: Number.POSITIVE_INFINITY
    })

    await this.store.quit()
  }

  protected async run (queue: Queue, parameters?: Record<string, unknown>): Promise<void> {
    const queueRunner = this.createQueueRunner()
    this.queueRunners.add(queueRunner)

    try {
      queue.tasks = await this.selectTasks(queue)
      await queueRunner.run(queue, parameters)
    } catch (error: unknown) {
      this.logger.error({ context: 'run' }, String(error))
    } finally {
      this.queueRunners.delete(queueRunner)
    }
  }

  protected async runListener (message: string): Promise<void> {
    const {
      id,
      parameters
    } = JSON.parse(message) as QueuerMessage

    if (id !== undefined) {
      const queue = await this.selectQueue(id)

      if (queue !== undefined) {
        await this.run(queue, parameters)
      }
    }
  }

  protected async runSchedule (date = new Date()): Promise<void> {
    const queues = await this.selectQueues(date)

    await Promise.all(queues.map(async (queue): Promise<void> => {
      await this.updateQueue(queue)

      if (queue.schedule_next !== null) {
        await this.run(queue)
      }
    }))
  }

  protected async selectQueue (id: number): Promise<Queue | undefined> {
    return this.database.select<Queue, Queue>(sql`
      SELECT *
      FROM queue
      WHERE id = $(id)
    `, {
      id
    })
  }

  protected async selectQueues (date: Date): Promise<Queue[]> {
    return this.database.selectAll<Queue & { date: Date}, Queue>(sql`
      SELECT *
      FROM queue
      WHERE
        name ${this.database.tokens.regexp} $(name) AND
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

  protected async selectTasks (queue: Queue): Promise<Task[]> {
    return this.database.selectAll<Task, Task>(sql`
      SELECT *
      FROM task
      WHERE fkey_queue_id = $(fkey_queue_id)
      ORDER BY number ASC
    `, {
      fkey_queue_id: queue.id
    })
  }

  protected async startListener (channel: string): Promise<void> {
    this.storeDuplicate?.nodeRedis.on('message', (ch, message) => {
      this
        .runListener(message)
        .catch((error: unknown) => {
          this.logger.error({ context: 'start-listener' }, String(error))
        })
    })

    await this.storeDuplicate?.subscribe(channel)
  }

  protected startSchedule (schedule: string): void {
    this.job = this.createJob(schedule, (date) => {
      this
        .runSchedule(date)
        .catch((error: unknown) => {
          this.logger.error({ context: 'start-schedule' }, String(error))
        })
    })
  }

  protected async updateQueue (queue: Queue): Promise<UpdateResult> {
    return this.database.update<Queue>(sql`
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
