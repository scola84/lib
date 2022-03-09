import type { Database, UpdateResult } from '../sql'
import type { Queue, QueueRun, QueueTask } from '../../entities'
import type { Readable, Transform, Writable } from 'stream'
import Ajv from 'ajv'
import type { Logger } from 'pino'
import type { ObjectSchema } from 'fluent-json-schema'
import type { Queuer } from './queuer'
import type { RedisClientType } from 'redis'
import type { Struct } from '../../../common'
import type { queue as fastq } from 'fastq'
import { pipeline } from '../stream'
import { promise } from 'fastq'
import { sql } from '../sql'
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
   * @see {@link Database}
   */
  database: Database

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
  schema: Struct<ObjectSchema | undefined>

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
   * @see {@link Database}
   */
  public database: Database

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
  public schema: Struct<ObjectSchema | undefined>

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
    const queue = promise<unknown, number>(async (id) => {
      return this.handleQueueTask(id)
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
        }, String(error))
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
  protected async finishQueueTask (task: QueueTask): Promise<void> {
    if (task.status === 'pending') {
      task.status = 'ok'
    }

    await Promise.all([
      this.updateQueueTaskOnFinish(task),
      this.updateQueueRun(task)
    ])

    const queues = await this.selectQueues(task)

    await Promise.all(queues.map(async ({ id }) => {
      await this.store.publish('queue', JSON.stringify({
        command: 'run',
        id,
        parameters: {
          id: task.run.id
        }
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
   * @param id - The ID of the task
   */
  protected async handleQueueTask (id: number): Promise<void> {
    try {
      const task = await this.selectQueueTask(id)

      if (task !== undefined) {
        try {
          task.run = await this.selectQueueRun(task)

          if (task.status === 'pending') {
            await this.prepareTask(task)
            task.result = (await this.handle(task)) ?? task.result
          }
        } catch (error: unknown) {
          task.reason = String(error)
          task.status = 'err'
        } finally {
          await this.finishQueueTask(task)
          this.read()
        }
      }
    } catch (error: unknown) {
      this.logger?.error({
        context: 'handle-queue-task'
      }, String(error))
    }
  }

  /**
   * Prepares the task.
   *
   * Updates the task and validates `options` and/or `payload`.
   *
   * @param task - The task
   */
  protected async prepareTask (task: QueueTask): Promise<void> {
    await this.updateQueueTaskOnRun(task)

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
        .readQueueTask()
        .then(() => {
          this.reading = false

          if ((this.queue?.running() ?? 0) < this.concurrency) {
            this.read()
          }
        })
        .catch(async (error: unknown) => {
          this.reading = false

          if ((String(error).endsWith('Socket closed unexpectedly'))) {
            await waitUntil(() => {
              return this.store.isOpen
            }, {
              timeout: Number.POSITIVE_INFINITY
            })

            this.read()
          } else if (!String(error).endsWith('Disconnects client')) {
            this.logger?.error({
              context: 'read-queue-task'
            }, String(error))
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
  protected async readQueueTask (): Promise<void> {
    const { element } = await this.storeRead?.blPop([this.name], this.timeout / 1000) ?? {}

    const task = {
      id: Number(element)
    }

    if (Number.isFinite(task.id)) {
      await this.updateQueueTaskOnRead(task)
      this.queue?.push(task.id)
    }
  }

  /**
   * Selects a queue run.
   *
   * @param task - The task
   * @returns The queue run
   */
  protected async selectQueueRun (task: QueueTask): Promise<QueueRun> {
    return this.database.selectOne<QueueRun, QueueRun>(sql`
      SELECT *
      FROM queue_run
      WHERE id = $(id)
    `, {
      id: task.fkey_queue_run_id
    })
  }

  /**
   * Selects a task.
   *
   * @param id - The ID of the task
   * @returns The task
   */
  protected async selectQueueTask (id: number): Promise<QueueTask | undefined> {
    return this.database.select<QueueTask, QueueTask>(sql`
      SELECT *
      FROM queue_task
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
   * * `queue.fkey_queue_id = queue_run.fkey_queue_id`
   * * `queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total`
   * * `queue_run.fkey_queue_task_id = queue_task.id`
   *
   * The second criterion may be true for multiple tasks (race condition). The latter criterion prevents this, because together they will only be satisfied by the last task.
   *
   * @param task - The task
   * @returns The queues
   */
  protected async selectQueues (task: QueueTask): Promise<Array<Pick<Queue, 'id'>>> {
    return this.database.selectAll<QueueRun, Pick<Queue, 'id'>>(sql`
      SELECT queue.id
      FROM queue
      JOIN queue_run ON queue.fkey_queue_id = queue_run.fkey_queue_id
      WHERE
        queue_run.id = $(id) AND
        queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total AND
        queue_run.fkey_queue_task_id = $(fkey_queue_task_id)
    `, {
      fkey_queue_task_id: task.id,
      id: task.run.id
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
      }, String(error))
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
   * Sets `fkey_queue_task_id` to the ID of the task.
   *
   * When the queue run has finished, sets `status` to either 'ok' or 'err', depending on the result of the task.
   *
   * @param task - The task
   * @returns The update result
   */
  protected async updateQueueRun (task: QueueTask): Promise<UpdateResult> {
    return this.database.update<QueueRun>(sql`
      UPDATE queue_run
      SET
        aggr_${task.status} = aggr_${task.status} + 1,
        date_updated = NOW(),
        fkey_queue_task_id = $(fkey_queue_task_id),
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
      WHERE id = $(id)
    `, {
      fkey_queue_task_id: task.id,
      id: task.run.id
    })
  }

  /**
   * Updates a task.
   *
   * Sets `status`, `reason` and `result`.
   *
   * @param task - The task
   * @returns The update result
   */
  protected async updateQueueTaskOnFinish (task: QueueTask): Promise<UpdateResult> {
    return this.database.update<QueueTask>(sql`
      UPDATE queue_task
      SET
        date_updated = NOW(),
        reason = $(reason),
        result = $(result),
        status = $(status)
      WHERE id = $(id)
    `, {
      id: task.id,
      reason: task.reason,
      result: task.result,
      status: task.status
    })
  }

  /**
   * Updates a task.
   *
   * Sets `date_queued` and `host`.
   *
   * @param task - The task
   * @returns The update result
   */
  protected async updateQueueTaskOnRead (task: Pick<QueueTask, 'id'>): Promise<UpdateResult> {
    return this.database.update<QueueTask>(sql`
      UPDATE queue_task
      SET
        date_queued = NOW(),
        date_updated = NOW(),
        host = $(host)
      WHERE id = $(id)
    `, {
      host: this.host,
      id: task.id
    })
  }

  /**
   * Updates a task.
   *
   * Sets `date_started`.
   *
   * @param task - The task
   * @returns The update result
   */
  protected async updateQueueTaskOnRun (task: QueueTask): Promise<UpdateResult> {
    return this.database.update<QueueTask>(sql`
      UPDATE queue_task
      SET
        date_started = NOW(),
        date_updated = NOW()
      WHERE id = $(id)
    `, {
      id: task.id
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
  protected abstract handle (task: QueueTask): Promise<unknown> | unknown
}
