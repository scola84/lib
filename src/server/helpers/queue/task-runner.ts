import type { Database, UpdateResult } from '../sql'
import type { DuplexOptions, Readable, Transform, Writable } from 'stream'
import type { Queue, QueueRun, TaskRun } from '../../entities'
import Ajv from 'ajv'
import type { Logger } from 'pino'
import type { ObjectSchema } from 'fluent-json-schema'
import type { Queuer } from './queuer'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import type { queue as fastq } from 'fastq'
import { pipeline } from '../stream'
import { promise } from 'fastq'
import { sql } from '../sql'
import waitUntil from 'async-wait-until'

export interface TaskRunnerOptions extends DuplexOptions {
  /**
   * The channel to trigger queue runs.
   *
   * @defaultValue `process.env.QUEUE_CHANNEL` or `'queue'`
   */
  channel: string

  /**
   * The concurrency.
   *
   * @defaultValue `process.env.QUEUE_CONCURRENCY` or `1`
   */
  concurrency: number | string

  /**
   * The database containing the queues.
   *
   * @see {@link Database}
   */
  database: Database

  /**
   * The host.
   *
   * @defaultValue `process.env.HOSTNAME` or `''`
   */
  host: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: Logger

  /**
   * The name.
   */
  name: string

  /**
   * The queuer.
   *
   * @see {@link Queuer}
   */
  queuer: Queuer

  /**
   * The schema.
   *
   * If it contains an `options` and/or `payload` schema the task runner will validate the options and/or payload of the task run respectively.
   *
   * @see https://www.npmjs.com/package/fluent-json-schema
   */
  schema: Record<string, ObjectSchema>

  /**
   * The store to trigger queue runs.
   *
   * @see https://preview.npmjs.com/package/handy-redis
   */
  store: WrappedNodeRedisClient

  /**
   * The amount of time to block the store list pop as milliseconds.
   *
   * @defaultValue `5 * 60 * 1000`
   */
  timeout: number
}

/**
 * Runs a task.
 */
export abstract class TaskRunner {
  /**
   * The task runner options.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Routes.md
   */
  public static options?: Partial<TaskRunnerOptions>

  /**
   * The channel to trigger queue runs.
   *
   * @defaultValue `process.env.QUEUE_CHANNEL` or `'queue'`
   */
  public channel: string

  /**
   * The concurrency.
   *
   * @defaultValue `process.env.QUEUE_CONCURRENCY` or `1`
   */
  public concurrency: number

  /**
   * The database containing the queues.
   *
   * @see {@link Database}
   */
  public database: Database

  /**
   * The host.
   *
   * @defaultValue `process.env.HOSTNAME` or `''`
   */
  public host: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

  /**
   * The name.
   */
  public name: string

  /**
   * The queue to run tasks concurrently.
   *
   * @see https://www.npmjs.com/package/fastq
   */
  public queue?: fastq

  /**
   * The schema.
   *
   * If it contains an `options` and/or `payload` schema the task runner will validate the options and/or payload of the task run respectively.
   *
   * @see https://www.npmjs.com/package/fluent-json-schema
   */
  public schema: Record<string, ObjectSchema>

  /**
   * The store to trigger queue runs.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  public store: WrappedNodeRedisClient

  /**
   * The store to trigger task runs.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  public storeDuplicate?: WrappedNodeRedisClient

  /**
   * The amount of time to block the store list pop as milliseconds.
   *
   * @defaultValue `5 * 60 * 1000`
   */
  public timeout: number

  /**
   * The validator to validate data against `schema`.
   *
   * @see https://www.npmjs.com/package/ajv
   */
  public validator?: Ajv

  /**
   * Creates a task runner.
   *
   * Merges the static class `options` and the constructor `options`.
   *
   * Adds the task runner to the queuer.
   *
   * @param options - The task runner options
   * @throws database is undefined
   * @throws name is undefined
   * @throws store is undefined
   */
  public constructor (options: Partial<TaskRunnerOptions>) {
    const runnerOptions = {
      ...TaskRunner.options,
      ...options
    }

    if (runnerOptions.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (runnerOptions.name === undefined) {
      throw new Error('Option "name is undefined')
    }

    if (runnerOptions.store === undefined) {
      throw new Error('Option "store" is undefined')
    }

    if (options.queuer !== undefined) {
      options.queuer.add(this)
    }

    this.channel = runnerOptions.channel ?? process.env.QUEUE_CHANNEL ?? 'queue'
    this.concurrency = Number(runnerOptions.concurrency ?? process.env.QUEUE_CONCURRENCY ?? 1)
    this.database = runnerOptions.database
    this.host = runnerOptions.host ?? process.env.HOSTNAME ?? ''
    this.logger = runnerOptions.logger?.child({ name: runnerOptions.name })
    this.name = runnerOptions.name
    this.schema = runnerOptions.schema ?? {}
    this.store = runnerOptions.store
    this.timeout = runnerOptions.timeout ?? 5 * 60 * 1000
  }

  /**
   * Creates a queue.
   *
   * The queue handles task runs in parallel with a concurrency given by `concurrency`.
   *
   * The queue calls `push` if it is drained.
   *
   * @returns The queue
   */
  public createQueue (): fastq {
    const queue = promise<unknown, TaskRun>(async (taskRun) => {
      return this.handleTaskRun(taskRun)
    }, this.concurrency)

    queue.drain = () => {
      this.push()
    }

    return queue
  }

  /**
   * Creates a duplicate of `store`.
   *
   * @returns The store duplicate
   */
  public createStoreDuplicate (): WrappedNodeRedisClient {
    return createNodeRedisClient(this.store.nodeRedis.duplicate())
  }

  /**
   * Creates a validator.
   *
   * Creates a validator and adds `schema` to the validator.
   *
   * @returns The validator
   */
  public createValidator (): Ajv {
    const validator = new Ajv({
      useDefaults: true
    })

    for (const name of Object.keys(this.schema)) {
      validator.addSchema(this.schema[name].valueOf(), name)
    }

    return validator
  }

  /**
   * Handles a data stream as a Promise.
   *
   * @param streams - The streams
   * @see {@link pipeline}
   */
  public async pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
    return pipeline(...streams)
  }

  /**
   * Sets up the task runner.
   *
   * Sets `queue`, `storeDuplicate` and `validator`.
   *
   * Registers an `error` event listener on `storeDuplicate`.
   */
  public setup (): void {
    this.queue = this.createQueue()
    this.storeDuplicate = this.createStoreDuplicate()
    this.validator = this.createValidator()

    this.storeDuplicate.nodeRedis.on('error', (error) => {
      this.logger?.error({ context: 'setup' }, String(error))
    })
  }

  /**
   * Starts the task runner.
   *
   * Calls `setup` and `push`.
   *
   * @param setup - Whether to call `setup`
   */
  public start (setup = true): void {
    this.logger?.info({
      channel: this.channel,
      concurrency: this.concurrency,
      host: this.host,
      timeout: this.timeout
    }, 'Starting task runner')

    if (setup) {
      this.setup()
    }

    this.push()
  }

  /**
   * Stops the task runner.
   *
   * Ends `storeDuplicate` and returns when all the task runs have finished.
   */
  public async stop (): Promise<void> {
    this.logger?.info({
      connected: [
        this.store.nodeRedis.connected,
        this.storeDuplicate?.nodeRedis.connected
      ],
      idle: this.queue?.idle(),
      queue: this.queue?.length()
    }, 'Stopping task runner')

    this.storeDuplicate?.end()

    await waitUntil(() => {
      return this.queue?.idle() === true
    }, {
      timeout: Number.POSITIVE_INFINITY
    })
  }

  /**
   * Finishes the task run.
   *
   * Sets `status` of the task run to 'ok' if it is pending.
   *
   * Updates the task run and the queue run.
   *
   * Triggers dependant queues if all task runs have finished successfully.
   *
   * @param taskRun - The task run
   */
  protected async finishTaskRun (taskRun: TaskRun): Promise<void> {
    taskRun.status = taskRun.status === 'pending' ? 'ok' : taskRun.status
    await this.updateTaskRunOnFinish(taskRun)
    await this.updateQueueRun(taskRun)
    const queues = await this.selectQueues(taskRun)

    await Promise.all(queues.map(async ({ id }) => {
      await this.store.publish(this.channel, JSON.stringify({
        id,
        parameters: {
          id: taskRun.queueRun.id
        }
      }))
    }))
  }

  /**
   * Handles the task run.
   *
   * Starts the task run.
   *
   * Sets `reason` and `status` of the task run if an error is caught.
   *
   * Finishes the task run.
   *
   * @param taskRun - The task run
   */
  protected async handleTaskRun (taskRun: TaskRun): Promise<void> {
    try {
      await this.runTask(taskRun)
    } catch (error: unknown) {
      taskRun.reason = String(error)
      taskRun.status = 'err'
    } finally {
      try {
        await this.finishTaskRun(taskRun)
      } catch (error: unknown) {
        this.logger?.error({ context: 'handle-task-run' }, String(error))
      }
    }
  }

  /**
   * Pushes a task run.
   *
   * Calls itself if the queue length is less than the `concurrency`.
   *
   * Calls itself if the store connection was lost and reestablished.
   */
  protected push (): void {
    this
      .pushTaskRun()
      .then(() => {
        if (Number(this.queue?.length()) < this.concurrency) {
          this.push()
        }
      })
      .catch(async (error: unknown) => {
        if ((/connection lost/ui).test(String(error))) {
          await waitUntil(() => {
            return this.store.nodeRedis.connected
          }, {
            timeout: Number.POSITIVE_INFINITY
          })

          this.push()
          return
        }

        this.logger?.error({ context: 'push' }, String(error))
      })
  }

  /**
   * Pushes a task run.
   *
   * Pops the ID of a task run from the head of the store list at `name`. Blocks for the amount of milliseconds given by `timeout`.
   *
   * Selects the task run and the queue run.
   *
   * Updates the task run and pushes it onto the queue.
   */
  protected async pushTaskRun (): Promise<void> {
    const [,id] = await this.storeDuplicate?.blpop([this.name], this.timeout / 1000) ?? []

    if (id === undefined) {
      return
    }

    try {
      const taskRun = await this.selectTaskRun(Number(id))
      taskRun.queueRun = await this.selectQueueRun(taskRun)
      await this.updateTaskRunOnPush(taskRun)
      this.queue?.push(taskRun)
    } catch (error: unknown) {
      this.logger?.error({ context: 'push-task-run' }, String(error))
    }
  }

  /**
   * Runs a task.
   *
   * Checks whether `status` of the task run is still 'pending', otherwise returns.
   *
   * Updates the task run, validates `options` and/or `payload` and calls `run`.
   *
   * @param taskRun - The task run
   */
  protected async runTask (taskRun: TaskRun): Promise<void> {
    if (taskRun.status !== 'pending') {
      return
    }

    await this.updateTaskRunOnRun(taskRun)

    if (this.validator?.getSchema('options') !== undefined) {
      this.validate('options', taskRun.queueRun.options)
    }

    if (this.validator?.getSchema('payload') !== undefined) {
      this.validate('payload', taskRun.payload)
    }

    await this.run(taskRun)
  }

  /**
   * Selects a queue run.
   *
   * @param taskRun - The task run
   * @returns The queue run
   */
  protected async selectQueueRun (taskRun: TaskRun): Promise<QueueRun> {
    return this.database.selectOne<QueueRun, QueueRun>(sql`
      SELECT *
      FROM queue_run
      WHERE id = $(id)
    `, {
      id: taskRun.fkey_queue_run_id
    })
  }

  /**
   * Selects queues.
   *
   * Applies the following criteria:
   *
   * * `queue.fkey_queue_id = queue_run.fkey_queue_id`
   * * `queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total`
   * * `queue_run.fkey_task_run_id = task_run.id`
   *
   * The second criterion may be true for multiple task run (race condition). The latter criterion prevents this, because together they will only be satisfied by the last task run.
   *
   * @param queueRun - The queue run
   * @returns The queues
   */
  protected async selectQueues (taskRun: TaskRun): Promise<Queue[]> {
    return this.database.selectAll<QueueRun, Queue>(sql`
      SELECT queue.id
      FROM queue
      JOIN queue_run ON queue.fkey_queue_id = queue_run.fkey_queue_id
      WHERE
        queue_run.id = $(id) AND
        queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total AND
        queue_run.fkey_task_run_id = $(fkey_task_run_id)
    `, {
      fkey_task_run_id: taskRun.id,
      id: taskRun.queueRun.id
    })
  }

  /**
   * Selects a task run.
   *
   * @param id - The ID of the task run
   * @returns The task run
   */
  protected async selectTaskRun (id: number): Promise<TaskRun> {
    return this.database.selectOne<TaskRun, TaskRun>(sql`
      SELECT *
      FROM task_run
      WHERE id = $(id)
    `, {
      id
    })
  }

  /**
   * Updates a queue run.
   *
   * Increments either `aggr_err` or `aggr_ok` by `1`, depending on the result of the task run.
   *
   * Sets `fkey_task_run_id` to the ID of the task run.
   *
   * @param taskRun - The task run
   * @returns The update result
   */
  protected async updateQueueRun (taskRun: TaskRun): Promise<UpdateResult> {
    return this.database.update<QueueRun>(sql`
      UPDATE queue_run
      SET
        aggr_${taskRun.status} = aggr_${taskRun.status} + 1,
        date_updated = NOW(),
        fkey_task_run_id = $(fkey_task_run_id)
      WHERE id = $(id)
    `, {
      fkey_task_run_id: taskRun.id,
      id: taskRun.queueRun.id
    })
  }

  /**
   * Updates a task run.
   *
   * Sets `status`, `reason` and `result`.
   *
   * @param taskRun - The task run
   * @returns The update result
   */
  protected async updateTaskRunOnFinish (taskRun: TaskRun): Promise<UpdateResult> {
    return this.database.update<TaskRun>(sql`
      UPDATE task_run
      SET
        date_updated = NOW(),
        reason = $(reason),
        result = $(result),
        status = $(status)
      WHERE id = $(id)
    `, {
      id: taskRun.id,
      reason: taskRun.reason,
      result: taskRun.result,
      status: taskRun.status
    })
  }

  /**
   * Update a task run.
   *
   * Sets `date_queued`.
   *
   * @param taskRun - The task run
   * @returns The update result
   */
  protected async updateTaskRunOnPush (taskRun: TaskRun): Promise<UpdateResult> {
    return this.database.update<TaskRun>(sql`
      UPDATE task_run
      SET
        date_queued = NOW(),
        date_updated = NOW()
      WHERE id = $(id)
    `, {
      id: taskRun.id
    })
  }

  /**
   * Update a task run.
   *
   * Sets `date_started` and `host`.
   *
   * @param taskRun - The task run
   * @returns The update result
   */
  protected async updateTaskRunOnRun (taskRun: TaskRun): Promise<UpdateResult> {
    return this.database.update<TaskRun>(sql`
      UPDATE task_run
      SET
        date_started = NOW(),
        date_updated = NOW(),
        host = $(host)
      WHERE id = $(id)
    `, {
      host: this.host,
      id: taskRun.id
    })
  }

  /**
   * Validates data against `schema` with the given name.
   *
   * @param name - The name of the schema
   * @param data - The data to be validated
   * @returns The validated data
   * @see https://ajv.js.org/api.html#validation-errors
   * @throws schema is undefined
   * @throws data is invalid
   */
  protected validate<Data = unknown>(name: string, data: Data): Data {
    const schema = this.validator?.getSchema(name)

    if (schema === undefined) {
      throw new Error(`Schema "${name}" is undefined`)
    }

    if (schema(data) === false) {
      const error = schema.errors?.[0]
      throw new Error(`${name}${error?.instancePath ?? ''} ${error?.message ?? ''}`)
    }

    return data
  }

  /**
   * Runs a task.
   *
   * @param taskRun - The task run
   */
  protected abstract run (taskRun: TaskRun): Promise<void>
}
