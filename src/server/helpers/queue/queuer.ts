import type { Database, UpdateResult } from '../sql'
import type { Job } from 'node-schedule'
import type { Queue } from '../../entities'
import { QueueRunner } from '../../helpers/queue/queue-runner'
import type { Struct } from '../../../common'
import type { TaskRun } from '../../entities/base'
import type { TaskRunner } from './task-runner'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import { isStruct } from '../../../common'
import { parseExpression } from 'cron-parser'
import type pino from 'pino'
import { scheduleJob } from 'node-schedule'
import { sql } from '../sql'
import waitUntil from 'async-wait-until'

export interface Commands {
  [key: string]: (queuer: Queuer, message: Record<string, unknown>) => Promise<void> | void
}

export interface QueuerOptions {
  /**
   * The database containing the queues.
   *
   * @see {@link Database}
   */
  database: Database

  /**
   * The databases to run generator queries on.
   *
   * @see {@link Database}
   */
  databases: Partial<Struct<Database>>

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger: pino.Logger

  /**
   * The names of the queues to run as a SQL pattern.
   *
   * @defaultValue `process.env.QUEUE_NAMES` or '%'
   */
  names?: string

  /**
   * The schedule to trigger queue runs as a cron schedule expression.
   *
   * @defaultValue `process.env.QUEUE_SCHEDULE` or '* * * * *'
   * @see https://www.npmjs.com/package/node-schedule
   */
  schedule?: string

  /**
   * The store to execute commands.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  store: WrappedNodeRedisClient

  /**
   * Whether the queuer is suspended.
   */
  suspended?: boolean
}

/**
 * Manages queues.
 */
export class Queuer {
  /**
   * The commands which can be executed through the 'queue' channel.
   */
  public static commands: Commands = {
    resume: (queuer: Queuer): void => {
      queuer.resume()
    },
    run: async (queuer: Queuer, message: Record<string, unknown>): Promise<void> => {
      if (typeof message.id === 'number') {
        await queuer.run(message.id, message.parameters)
      }
    },
    skip: async (queuer: Queuer, message: Record<string, unknown>): Promise<void> => {
      if (typeof message.id === 'number') {
        await queuer.skip(message.id)
      }
    },
    suspend: (queuer: Queuer): void => {
      queuer.suspend()
    }
  }

  /**
   * The database containing the queues.
   *
   * @see {@link Database}
   */
  public database: Database

  /**
   * The databases to run generator queries on.
   *
   * @see {@link Database}
   */
  public databases: Partial<Struct<Database>>

  /**
   * The job to trigger queue runs.
   *
   * @see https://www.npmjs.com/package/node-schedule
   */
  public job?: Job

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger: pino.Logger

  /**
   * The names of the queues to run as a SQL pattern.
   *
   * @defaultValue `process.env.QUEUE_NAMES` or '%'
   */
  public names: string

  /**
   * The active queue runners.
   *
   * @see {@link QueueRunner}
   */
  public queueRunners: Set<QueueRunner> = new Set()

  /**
   * The schedule to trigger queue runs as a cron schedule expression.
   *
   * @defaultValue `process.env.QUEUE_SCHEDULE` or '* * * * *'
   * @see https://www.npmjs.com/package/node-schedule
   */
  public schedule: string

  /**
   * The store to execute commands.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  public store: WrappedNodeRedisClient

  /**
   * The store duplicate to execute commands.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  public storeDuplicate?: WrappedNodeRedisClient

  /**
   * Whether the queuer is suspended.
   */
  public suspended: boolean

  /**
   * The active task runners.
   *
   * @see {@link TaskRunner}
   */
  public taskRunners: Set<TaskRunner> = new Set()

  /**
   * The commands which can be executed through the 'queue' channel.
   */
  protected commands = Queuer.commands

  /**
   * Creates a queuer.
   *
   * @param options - The queuer options
   */
  public constructor (options: QueuerOptions) {
    this.database = options.database
    this.databases = options.databases
    this.names = options.names ?? process.env.QUEUE_NAMES ?? '%'
    this.schedule = options.schedule ?? process.env.QUEUE_SCHEDULE ?? '* * * * *'
    this.store = options.store
    this.suspended = options.suspended ?? false

    this.logger = options.logger.child({
      name: 'queuer'
    })
  }

  /**
   * Adds a task runner to the set of active task runners.
   *
   * @param taskRunner - The task runner
   */
  public add (taskRunner: TaskRunner): void {
    this.taskRunners.add(taskRunner)
  }

  /**
   * Creates a job which calls the callback according to the schedule.
   *
   * @param schedule - The schedule
   * @param callback - The callback
   * @returns The job
   */
  public createJob (schedule: string, callback: (date: Date) => void): Job {
    return scheduleJob(schedule, callback)
  }

  /**
   * Creates a queue runner.
   *
   * @returns The queue runner
   */
  public createQueueRunner (): QueueRunner {
    return new QueueRunner({
      database: this.database,
      databases: this.databases,
      logger: this.logger,
      store: this.store
    })
  }

  /**
   * Creates a duplicate of the store.
   *
   * @returns The store duplicate
   */
  public createStoreDuplicate (): WrappedNodeRedisClient {
    return createNodeRedisClient(this.store.nodeRedis.duplicate())
  }

  /**
   * Resumes the queuer.
   */
  public resume (): void {
    this.logger.info('Resuming queuer')
    this.suspended = false
  }

  /**
   * Runs a queue run.
   *
   * @param id - The ID of the queue
   * @param parameters - The parameters
   * @see {@link QueueRunner.run}
   */
  public async run (id: number, parameters?: unknown): Promise<void> {
    const queue = await this.selectQueue(id)

    if (queue !== undefined) {
      if (isStruct(parameters)) {
        await this.runQueue(queue, parameters)
      } else {
        await this.runQueue(queue)
      }
    }
  }

  /**
   * Sets up the queuer.
   *
   * Sets `storeDuplicate` and registers an `error` event listener on `store` and `storeDuplicate`.
   */
  public setup (): void {
    this.storeDuplicate = this.createStoreDuplicate()

    this.store.nodeRedis.on('error', (error) => {
      this.logger.error({
        context: 'setup'
      }, String(error))
    })

    this.storeDuplicate.nodeRedis.on('error', (error) => {
      this.logger.error({
        context: 'setup'
      }, String(error))
    })
  }

  /**
   * Skips the remainder of a queue run.
   *
   * Updates all task runs by setting their `status` to 'err' and `reason` to 'skipped'.
   *
   * @param id - The ID of the queue run
   */
  public async skip (id: number): Promise<void> {
    await this.updateTaskRuns({
      fkey_queue_run_id: id,
      reason: 'skipped',
      status: 'err'
    })
  }

  /**
   * Starts the queuer.
   *
   * Calls `setup`.
   *
   * Starts the job and listener to trigger queue runs.
   *
   * @param setup - Whether to call `setup`
   */
  public async start (setup = true): Promise<void> {
    this.logger.info({
      names: this.names,
      schedule: this.schedule
    }, 'Starting queuer')

    if (setup) {
      this.setup()
    }

    this.startJob()
    await this.startListener()
  }

  /**
   * Stops the queuer.
   *
   * Stops the job, listener and all task runners.
   *
   * Closes the store when all the queue runners have finished.
   */
  public async stop (): Promise<void> {
    this.logger.info({
      connected: [
        this.store.nodeRedis.connected,
        this.storeDuplicate?.nodeRedis.connected
      ],
      queueRunners: this.queueRunners.size,
      taskRunners: this.taskRunners.size
    }, 'Stopping queuer')

    this.stopJob()
    await this.stopListener()

    const runners = Array.from(this.taskRunners)

    await Promise.all(runners.map(async (taskRunner) => {
      await taskRunner.stop()
    }))

    await waitUntil(() => {
      return this.queueRunners.size === 0
    }, {
      timeout: Number.POSITIVE_INFINITY
    })

    await this.store.quit()
  }

  /**
   * Suspends the queuer.
   */
  public suspend (): void {
    this.logger.info('Suspending queuer')
    this.suspended = true
  }

  /**
   * Handles a job trigger.
   *
   * Selects the queues which should be run.
   *
   * Updates `schedule_next` of all selected queues.
   *
   * Runs the queues of which `schedule_next` is not `null`.
   *
   * @param date - The date the job was triggered
   */
  protected async handleJob (date = new Date()): Promise<void> {
    const queues = await this.selectQueues(date)

    await Promise.all(queues.map(async (queue): Promise<void> => {
      await this.updateQueue(queue)

      if (queue.schedule_next !== null) {
        await this.runQueue(queue)
      }
    }))
  }

  /**
   * Handles a listener message.
   *
   * Parses the message and executes the command.
   *
   * @param message - The message received by the listener
   */
  protected async handleListener (message: string): Promise<void> {
    const parsedMessage: unknown = JSON.parse(message)

    if (isStruct(parsedMessage)) {
      const { command } = parsedMessage

      if (
        typeof command === 'string' &&
        typeof this.commands[command] === 'function'
      ) {
        await this.commands[command](this, parsedMessage)
      }
    }
  }

  /**
   * Runs a queue.
   *
   * Creates a queue runner and adds it to the set of active queue runners.
   *
   * Runs the queue runner and deletes it from the set of active queue runners when it has finished.
   *
   * Executes only if the queuer is not suspended.
   *
   * @param queue - The queue
   * @param parameters - The parameters
   */
  protected async runQueue (queue: Queue, parameters?: Record<string, unknown>): Promise<void> {
    if (!this.suspended) {
      const queueRunner = this.createQueueRunner()

      try {
        this.queueRunners.add(queueRunner)
        await queueRunner.run(queue, parameters)
      } catch (error: unknown) {
        this.logger.error({
          context: 'run'
        }, String(error))
      } finally {
        this.queueRunners.delete(queueRunner)
      }
    }
  }

  /**
   * Selects a queue.
   *
   * @param id - The id of the queue
   * @returns The queue
   */
  protected async selectQueue (id: number): Promise<Queue | undefined> {
    return this.database.select<Queue, Queue>(sql`
      SELECT *
      FROM queue
      WHERE id = $(id)
    `, {
      id
    })
  }

  /**
   * Selects queues.
   *
   * Applies the following criteria:
   *
   * * `name` matches `names`
   * * `schedule_begin` \<= the reference date
   * * `schedule_end` is null or \>= the reference date
   * * `schedule_next` is null or \<= the reference date
   *
   * @param date - The reference date
   * @returns The queues
   */
  protected async selectQueues (date: Date): Promise<Queue[]> {
    return this.database.selectAll<Queue, Queue>(sql`
      SELECT *
      FROM queue
      WHERE
        name LIKE $(name) AND
        schedule_begin <= $(schedule_begin) AND (
          schedule_end >= $(schedule_end) OR
          schedule_end IS NULL
        ) AND (
          schedule_next <= $(schedule_next) OR
          schedule_next IS NULL
        )
    `, {
      name: this.names,
      schedule_begin: date,
      schedule_end: date,
      schedule_next: date
    })
  }

  /**
   * Starts the job.
   *
   * Runs the job according to `schedule`.
   */
  protected startJob (): void {
    this.job = this.createJob(this.schedule, (date) => {
      this
        .handleJob(date)
        .catch((error: unknown) => {
          this.logger.error({
            context: 'start-job'
          }, String(error))
        })
    })
  }

  /**
   * Start the listener.
   *
   * Subscribes to the 'queue' channel of the store.
   */
  protected async startListener (): Promise<void> {
    this.storeDuplicate?.nodeRedis.on('message', (channel, message) => {
      this
        .handleListener(message)
        .catch((error: unknown) => {
          this.logger.error({
            context: 'start-listener'
          }, String(error))
        })
    })

    await this.storeDuplicate?.subscribe('queue')
  }

  /**
   * Stops the job.
   */
  protected stopJob (): void {
    this.job?.cancel()
  }

  /**
   * Stops the listener.
   */
  protected async stopListener (): Promise<void> {
    await this.storeDuplicate?.unsubscribe('queue')
    await this.storeDuplicate?.quit()
  }

  /**
   * Updates a queue.
   *
   * Parses `schedule` of the queue and updates `schedule_next` of the queue in the database accordingly.
   *
   * @param queue - The queue
   * @returns The update result
   */
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

  /**
   * Updates task runs.
   *
   * Sets `reason` and `status` of all task runs which:
   *
   * * are still pending
   * * are not yet started
   * * belong to the given queue run
   *
   * @param taskRun - The generic task run
   * @returns The update result
   */
  protected async updateTaskRuns (taskRun: Pick<TaskRun, 'fkey_queue_run_id' | 'reason' | 'status'>): Promise<UpdateResult> {
    return this.database.update<TaskRun>(sql`
      UPDATE task_run
      SET
        date_updated = NOW(),
        reason = $(reason),
        status = $(status)
      WHERE
        date_started IS NULL AND
        fkey_queue_run_id = $(fkey_queue_run_id) AND
        status = 'pending'
    `, {
      fkey_queue_run_id: taskRun.fkey_queue_run_id,
      reason: taskRun.reason,
      status: taskRun.status
    })
  }
}
