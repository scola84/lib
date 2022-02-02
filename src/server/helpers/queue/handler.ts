import type { Database, UpdateResult } from '../sql'
import type { Queue, QueueRun, QueueTask } from '../../entities'
import type { Readable, Transform, Writable } from 'stream'
import Ajv from 'ajv'
import type { ObjectSchema } from 'fluent-json-schema'
import type { Queuer } from './queuer'
import type { Struct } from '../../../common'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import type { queue as fastq } from 'fastq'
import type pino from 'pino'
import { pipeline } from '../stream'
import { promise } from 'fastq'
import { sql } from '../sql'
import waitUntil from 'async-wait-until'

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
  logger?: pino.Logger

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
   * @see https://www.npmjs.com/package/fluent-json-schema
   */
  schema: Struct<ObjectSchema | undefined>

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
export abstract class QueueHandler {
  /**
   * The queue handler options.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Routes.md
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
  public logger?: pino.Logger

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
   * The schema.
   *
   * If it contains an `options` and/or `payload` schema the queue handler will validate the options and/or payload of the task respectively.
   *
   * @see https://www.npmjs.com/package/fluent-json-schema
   */
  public schema: Struct<ObjectSchema | undefined> = {}

  /**
   * The store to trigger queue runs.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  public store: WrappedNodeRedisClient

  /**
   * The store to trigger tasks.
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
   * Creates a queue handler.
   *
   * Merges the static class `options` and the constructor `options`.
   *
   * Adds the queue handler to the queuer.
   *
   * @param options - The queue handler options
   * @throws database is undefined
   * @throws name is undefined
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
    this.schema = handlerOptions.schema ?? this.schema
    this.store = handlerOptions.store
    this.timeout = handlerOptions.timeout ?? 5 * 60 * 1000
    this.queuer.add(this)
  }

  /**
   * Creates a queue.
   *
   * The queue handles tasks in parallel with a concurrency given by `concurrency`.
   *
   * The queue calls `push` if it is drained.
   *
   * @returns The queue
   */
  public createQueue (): fastq {
    const queue = promise<unknown, number>(async (id) => {
      return this.handleQueueTask(id)
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
  public async pipeline (...streams: Array<Readable | Transform | Writable>): Promise<unknown> {
    return pipeline(...streams)
  }

  /**
   * Starts the queue handler.
   *
   * Calls `push`.
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
    this.storeDuplicate = this.createStoreDuplicate()
    this.validator = this.createValidator()

    this.storeDuplicate.nodeRedis.on('error', (error) => {
      this.logger?.error({
        context: 'setup'
      }, String(error))
    })

    this.push()
  }

  /**
   * Stops the queue handler.
   *
   * Ends `storeDuplicate` and returns when all the tasks have finished.
   */
  public async stop (): Promise<void> {
    this.logger?.info({
      connected: [
        this.store.nodeRedis.connected,
        this.storeDuplicate?.nodeRedis.connected
      ],
      idle: this.queue?.idle(),
      queue: this.queue?.length()
    }, 'Stopping queue handler')

    this.storeDuplicate?.end()

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

    await this.updateQueueTaskOnFinish(task)
    await this.updateQueueRun(task)

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
   * Selects the task and queue run. Updates the task, validates `options` and/or `payload` and calls `handle`.
   *
   * Sets `reason` and `status` of the task if an error is caught.
   *
   * Finishes the task
   *
   * @param task - The ID of the task
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
        }
      }
    } catch (error: unknown) {
      this.logger?.error({
        context: 'handle-queue-task'
      }, String(error))
    }
  }

  protected async prepareTask (task: QueueTask): Promise<QueueTask> {
    await this.updateQueueTaskOnRun(task)

    if (this.validator?.getSchema('options') !== undefined) {
      this.validate('options', task.run.options)
    }

    if (this.validator?.getSchema('payload') !== undefined) {
      this.validate('payload', task.payload)
    }

    return task
  }

  /**
   * Pushes a task.
   *
   * Calls itself if the queue length is less than the `concurrency`.
   *
   * Calls itself if the store connection was lost and reestablished.
   */
  protected push (): void {
    this
      .pushQueueTask()
      .then(() => {
        if ((this.queue?.length() ?? 0) < this.concurrency) {
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

        this.logger?.error({
          context: 'push'
        }, String(error))
      })
  }

  /**
   * Pushes a task.
   *
   * Pops the ID of the task from the head of the store list at `name`. Blocks for the amount of milliseconds given by `timeout`.
   *
   * Updates the task and pushes the ID onto the queue.
   */
  protected async pushQueueTask (): Promise<void> {
    const [,id] = await this.storeDuplicate?.blpop([this.name], this.timeout / 1000) ?? []

    const task = {
      id: Number(id)
    }

    if (Number.isFinite(task.id)) {
      await this.updateQueueTaskOnPush(task)
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
  protected async updateQueueTaskOnPush (task: Pick<QueueTask, 'id'>): Promise<UpdateResult> {
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
   * Runs a task.
   *
   * @param task - The task
   */
  protected abstract handle (task: QueueTask): Promise<unknown>
}
