import type { Queue, Run, Task } from '../../entities'
import type { Readable, Transform, Writable } from 'stream'
import Ajv from 'ajv'
import type { Logger } from 'pino'
import type { ObjectSchema } from 'fluent-json-schema'
import type { Queuer } from './queuer'
import type { RedisClientType } from 'redis'
import type { SqlDatabase } from '../sql'
import type { Struct } from '../../../common'
import type { queue as fastq } from 'fastq'
import { pipeline } from '../stream'
import { promise } from 'fastq'
import { sql } from '../sql'
import { toString } from '../../../common'
import waitUntil from 'async-wait-until'

declare module 'fastq' {
  interface queue {
    running: () => number
  }
}

export interface QueueHandlerOptions {
  /**
   * The concurrency.
   *
   * @defaultValue `process.env.QUEUE_CONCURRENCY` or 1
   */
  concurrency: number | string

  /**
   * The database containing the queues.
   *
   * @see {@link SqlDatabase}
   */
  database: SqlDatabase

  /**
   * The host.
   *
   * @defaultValue `process.env.HOSTNAME` or ''
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
   * If it contains an `options` and/or `payload` schema the queue handler will validate the options and/or payload of the task respectively.
   *
   * @defaultValue `{}`
   * @see https://www.npmjs.com/package/fluent-json-schema
   */
  schema: Partial<Struct<ObjectSchema>>

  /**
   * The store.
   *
   * @see https://preview.npmjs.com/package/redis
   */
  store: RedisClientType

  /**
   * The amount of time to block the store list pop as milliseconds.
   *
   * @defaultValue `5 * 60 * 1000`
   */
  timeout: number
}

/**
 * Handles a queue task.
 */
export abstract class QueueHandler {
  /**
   * The queue handler options.
   */
  public static options?: Partial<QueueHandlerOptions>

  /**
   * The concurrency.
   *
   * @defaultValue `process.env.QUEUE_CONCURRENCY` or 1
   */
  public concurrency: number

  /**
   * The database containing the queues.
   *
   * @see {@link SqlDatabase}
   */
  public database: SqlDatabase

  /**
   * The host.
   *
   * @defaultValue `process.env.HOSTNAME` or ''
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
   * The queue to handle tasks concurrently.
   *
   * @see https://www.npmjs.com/package/fastq
   */
  public queue?: fastq<number>

  /**
   * The queuer.
   *
   * @see {@link Queuer}
   */
  public queuer: Queuer

  /**
   * Whether the queue handler is reading a task.
   */
  public reading = false

  /**
   * The schema.
   *
   * If it contains an `options` and/or `payload` schema the queue handler will validate the options and/or payload of the task respectively.
   *
   * @defaultValue `{}`
   * @see https://www.npmjs.com/package/fluent-json-schema
   */
  public schema: Partial<Struct<ObjectSchema>>

  /**
   * The store to write.
   *
   * @see https://www.npmjs.com/package/redis
   */
  public store: RedisClientType

  /**
   * The store to read.
   *
   * @see https://www.npmjs.com/package/redis
   */
  public storeRead?: RedisClientType

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
   * Creates a queue handler.
   *
   * Merges the static class `options` and the constructor `options`.
   *
   * Adds the queue handler to the queuer.
   *
   * @param options - The queue handler options
   * @throws database is undefined
   * @throws name is undefined
   * @throws queuer is undefined
   * @throws store is undefined
   */
  public constructor (options: Partial<QueueHandlerOptions>) {
    const handlerOptions = {
      ...QueueHandler.options,
      ...options
    }

    if (handlerOptions.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (handlerOptions.name === undefined) {
      throw new Error('Option "name is undefined')
    }

    if (handlerOptions.queuer === undefined) {
      throw new Error('Option "queuer" is undefined')
    }

    if (handlerOptions.store === undefined) {
      throw new Error('Option "store" is undefined')
    }

    this.concurrency = Number(handlerOptions.concurrency ?? process.env.QUEUE_CONCURRENCY ?? 1)
    this.database = handlerOptions.database
    this.host = handlerOptions.host ?? process.env.HOSTNAME ?? ''
    this.logger = handlerOptions.logger
    this.name = handlerOptions.name
    this.queuer = handlerOptions.queuer
    this.schema = handlerOptions.schema ?? {}
    this.store = handlerOptions.store
    this.timeout = handlerOptions.timeout ?? 5 * 60 * 1000
    this.queuer.register(this)
  }

  /**
   * Creates a queue.
   *
   * The queue handles tasks in parallel with a concurrency given by `concurrency`.
   *
   * @returns The queue
   */
  public createQueue (): fastq {
    const queue = promise<unknown, number>(async (taskId) => {
      return this.handleTask(taskId)
    }, this.concurrency)

    return queue
  }

  /**
   * Creates a store.
   *
   * @returns The store
   */
  public createStore (): RedisClientType {
    return this.store.duplicate()
  }

  /**
   * Creates a validator.
   *
   * Adds `schema` to the validator.
   *
   * @returns The validator
   */
  public createValidator (): Ajv {
    const validator = new Ajv({
      allErrors: true,
      coerceTypes: true,
      useDefaults: true
    })

    Object
      .entries(this.schema)
      .forEach(([name, schema]) => {
        if (schema !== undefined) {
          validator.addSchema(schema.valueOf(), name)
        }
      })

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
   * Starts the queue handler.
   */
  public start (): void {
    this.logger = this.logger?.child({
      name: this.name
    })

    this.logger?.info({
      concurrency: this.concurrency,
      host: this.host,
      timeout: this.timeout
    }, 'Starting queue handler')

    this.queue = this.createQueue()
    this.validator = this.createValidator()

    this
      .startRead()
      .catch((error) => {
        this.logger?.error({
          context: 'start-read'
        }, toString(error))
      })
  }

  /**
   * Stops the queue handler.
   *
   * Returns when all the tasks have finished.
   */
  public async stop (): Promise<void> {
    this.logger?.info({
      idle: this.queue?.idle(),
      queue: this.queue?.length()
    }, 'Stopping queue handler')

    await this.stopRead()

    await waitUntil(() => {
      return this.queue?.idle() === true
    }, {
      timeout: Number.POSITIVE_INFINITY
    })

    this.logger?.info('Stopped queue handler')
  }

  /**
   * Finishes a task.
   *
   * Sets `status` of the task to 'ok' if it is pending.
   *
   * Updates the task and the queue run.
   *
   * Triggers dependant queues if all tasks have finished successfully.
   *
   * @param task - The task
   */
  protected async finishTask (task: Task): Promise<void> {
    if (task.status === 'pending') {
      task.status = 'ok'
    }

    await Promise.all([
      this.updateTaskOnFinish(task),
      this.updateRun(task)
    ])

    const queues = await this.selectQueues(task)

    await Promise.all(queues.map(async (nextQueue) => {
      await this.store.publish('queue', JSON.stringify({
        command: 'run',
        parameters: {
          run_id: task.run.run_id
        },
        queue_id: nextQueue.queue_id
      }))
    }))
  }

  /**
   * Handles a task.
   *
   * Selects the task and queue run. Prepares the task and calls `handle`.
   *
   * Sets `reason` and `status` of the task if an error is caught.
   *
   * Finishes the task and calls `read`.
   *
   * @param taskId - The ID of the task
   */
  protected async handleTask (taskId: number): Promise<void> {
    try {
      const task = await this.selectTask(taskId)

      if (task !== undefined) {
        try {
          task.run = await this.selectRun(task)

          if (task.status === 'pending') {
            await this.prepareTask(task)
            task.result = (await this.handle(task)) ?? task.result
          }
        } catch (error: unknown) {
          task.reason = toString(error)
          task.status = 'err'
        } finally {
          await this.finishTask(task)
          this.read()
        }
      }
    } catch (error: unknown) {
      this.logger?.error({
        context: 'handle-queue-task'
      }, toString(error))
    }
  }

  /**
   * Prepares the task.
   *
   * Updates the task and validates `options` and/or `payload`.
   *
   * @param task - The task
   */
  protected async prepareTask (task: Task): Promise<void> {
    await this.updateTaskOnRun(task)

    if (this.validator?.getSchema('options') !== undefined) {
      this.validate('options', task.run.options)
    }

    if (this.validator?.getSchema('payload') !== undefined) {
      this.validate('payload', task.payload)
    }
  }

  /**
   * Reads a task.
   *
   * Calls itself if the queue length is less than `concurrency`.
   *
   * Calls itself if the store is reopened.
   */
  protected read (): void {
    if (!this.reading) {
      this.reading = true

      this
        .readTask()
        .then(() => {
          this.reading = false

          if ((this.queue?.running() ?? 0) < this.concurrency) {
            this.read()
          }
        })
        .catch(async (error: unknown) => {
          this.reading = false

          if ((toString(error).endsWith('Socket closed unexpectedly'))) {
            await waitUntil(() => {
              return this.store.isOpen
            }, {
              timeout: Number.POSITIVE_INFINITY
            })

            this.read()
          } else if (!toString(error).endsWith('Disconnects client')) {
            this.logger?.error({
              context: 'read-queue-task'
            }, toString(error))
          }
        })
    }
  }

  /**
   * Reads a task.
   *
   * Pops the ID of the task from the head of the store list at `name`. Blocks for the amount of milliseconds given by `timeout`.
   *
   * Updates the task and pushes the ID onto the queue.
   */
  protected async readTask (): Promise<void> {
    const { element } = await this.storeRead?.blPop([this.name], this.timeout / 1000) ?? {}

    const task = {
      task_id: Number(element)
    }

    if (Number.isFinite(task.task_id)) {
      await this.updateTaskOnRead(task)
      this.queue?.push(task.task_id)
    }
  }

  /**
   * Selects queues.
   *
   * Applies the following criteria:
   *
   * * `queue.queue_id = run.queue_id`
   * * `run.aggr_ok + run.aggr_err = run.aggr_total`
   * * `run.task_id = task.task_id`
   *
   * The second criterion may be true for multiple tasks (race condition). The latter criterion prevents this, because together they will only be satisfied by the last task.
   *
   * @param task - The task
   * @returns The queues
   */
  protected async selectQueues (task: Task): Promise<Array<Pick<Queue, 'queue_id'>>> {
    return this.database.selectAll<Run, Pick<Queue, 'queue_id'>>(sql`
      SELECT queue.queue_id
      FROM queue
      JOIN run ON queue.parent_id = run.queue_id
      WHERE
        run.run_id = $(run_id) AND
        run.aggr_ok + run.aggr_err = run.aggr_total AND
        run.task_id = $(task_id)
    `, {
      run_id: task.run.run_id,
      task_id: task.task_id
    })
  }

  /**
   * Selects a queue run.
   *
   * @param task - The task
   * @returns The queue run
   */
  protected async selectRun (task: Task): Promise<Run> {
    return this.database.selectOne<Run, Run>(sql`
      SELECT *
      FROM run
      WHERE run_id = $(run_id)
    `, {
      run_id: task.run_id
    })
  }

  /**
   * Selects a task.
   *
   * @param taskId - The ID of the task
   * @returns The task
   */
  protected async selectTask (taskId: number): Promise<Task | undefined> {
    return this.database.select<Task, Task>(sql`
      SELECT *
      FROM task
      WHERE task_id = $(task_id)
    `, {
      task_id: taskId
    })
  }

  /**
   * Starts reading tasks from the store.
   *
   * Sets `storeRead`, connects it and calls `read`.
   */
  protected async startRead (): Promise<void> {
    this.storeRead?.removeAllListeners()
    this.storeRead = this.createStore()

    this.storeRead.on('error', (error) => {
      this.logger?.error({
        context: 'store'
      }, toString(error))
    })

    await this.storeRead.connect()
    this.read()
  }

  /**
   * Stops reading tasks from the store.
   *
   * Disconnects `storeRead`.
   */
  protected async stopRead (): Promise<void> {
    await this.storeRead?.disconnect()
  }

  /**
   * Updates a queue run.
   *
   * Increments either `aggr_err` or `aggr_ok` by 1, depending on the result of the task.
   *
   * Sets `task_id` to the ID of the task.
   *
   * When the queue run has finished, sets `status` to either 'ok' or 'err', depending on the result of the task.
   *
   * @param task - The task
   */
  protected async updateRun (task: Pick<Task, 'run' | 'status' | 'task_id'>): Promise<void> {
    await this.database.update<Run>(sql`
      UPDATE run
      SET
        aggr_${task.status} = aggr_${task.status} + 1,
        date_updated = NOW(),
        task_id = $(task_id),
        status = (
          CASE
            WHEN aggr_err + aggr_ok + 1 = aggr_total THEN
              CASE
                WHEN '${task.status}' = 'err' OR aggr_err > 0 THEN 'err'
                ELSE 'ok'
              END
            ELSE 'pending'
          END
        )
      WHERE run_id = $(run_id)
    `, {
      run_id: task.run.run_id,
      task_id: task.task_id
    })
  }

  /**
   * Updates a task.
   *
   * Sets `status`, `reason` and `result`.
   *
   * @param task - The task
   */
  protected async updateTaskOnFinish (task: Pick<Task, 'reason' | 'result' | 'status' | 'task_id'>): Promise<void> {
    await this.database.update<Task>(sql`
      UPDATE task
      SET
        date_updated = NOW(),
        reason = $(reason),
        result = $(result),
        status = $(status)
      WHERE task_id = $(task_id)
    `, {
      reason: task.reason,
      result: task.result,
      status: task.status,
      task_id: task.task_id
    })
  }

  /**
   * Updates a task.
   *
   * Sets `date_queued` and `host`.
   *
   * @param task - The task
   */
  protected async updateTaskOnRead (task: Pick<Task, 'task_id'>): Promise<void> {
    await this.database.update<Task>(sql`
      UPDATE task
      SET
        date_queued = NOW(),
        date_updated = NOW(),
        host = $(host)
      WHERE task_id = $(task_id)
    `, {
      host: this.host,
      task_id: task.task_id
    })
  }

  /**
   * Updates a task.
   *
   * Sets `date_started`.
   *
   * @param task - The task
   */
  protected async updateTaskOnRun (task: Pick<Task, 'task_id'>): Promise<void> {
    await this.database.update<Task>(sql`
      UPDATE task
      SET
        date_started = NOW(),
        date_updated = NOW()
      WHERE task_id = $(task_id)
    `, {
      task_id: task.task_id
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
  protected validate<Data = Struct>(name: string, data: Data): Data {
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
   * Handles a task.
   *
   * @param task - The task
   */
  protected abstract handle (task: Task): Promise<unknown> | unknown
}
