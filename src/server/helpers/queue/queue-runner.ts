import type { Database, InsertResult, UpdateResult } from '../sql'
import { PassThrough, Writable } from 'stream'
import type { Queue, QueueRun, TaskRun } from '../../../common/entities'
import type { Logger } from 'pino'
import type { Readable } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createQueueRun } from '../../../common/entities'
import { pipeline } from '../stream'
import { sql } from '../sql'

export interface QueueRunnerOptions {
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
  databases: Partial<Record<string, Database>>

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: Logger

  /**
   * The store to trigger task runs.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  store: WrappedNodeRedisClient
}

/**
 * Runs a queue.
 */
export class QueueRunner {
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
  public databases: Partial<Record<string, Database>>

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

  /**
   * The store to trigger task runs.
   *
   * @see https://www.npmjs.com/package/handy-redis
   */
  public store: WrappedNodeRedisClient

  /**
   * Creates a queue runner.
   *
   * @param options - The queue runner options
   */
  public constructor (options: QueueRunnerOptions) {
    this.database = options.database
    this.databases = options.databases
    this.store = options.store

    this.logger = options.logger?.child({
      name: 'queue-runner'
    })
  }

  /**
   * Creates a task run reader.
   *
   * Returns a PassThrough if the parameters contain a `payload`. The PassThrough emits the payload exactly once.
   *
   * Executes the generator query of the queue as a stream otherwise.
   *
   * @param queue - The queue
   * @param parameters - The parameters
   * @returns The reader
   */
  public async createTaskRunReader (queue: Queue, parameters?: Record<string, unknown>): Promise<Readable> {
    if (parameters?.payload !== undefined) {
      const reader = new PassThrough({
        objectMode: true
      })

      reader.end(parameters.payload)
      return reader
    }

    const database = this.databases[queue.database ?? '']

    if (database === undefined) {
      throw new Error('Database is undefined')
    }

    return database.stream(queue.query ?? '', parameters)
  }

  /**
   * Creates a task run writer.
   *
   * The writer receives a payload and inserts a task run based on the queue run and the payload into the database.
   *
   * The writer pushes the ID of the task run at the tail of the store list at `name` of the queue run.
   *
   * The writer increments `aggr_total` of the queue run with `1`.
   *
   * @param queueRun - The queue run
   * @returns The writer
   */
  public createTaskRunWriter (queueRun: QueueRun): Writable {
    return new Writable({
      objectMode: true,
      write: async (payload: unknown, encoding, finish) => {
        try {
          queueRun.aggr_total += 1

          await this.store.rpush(
            queueRun.name,
            `${(await this.insertTaskRun(queueRun, payload)).id}`
          )

          finish()
        } catch (error: unknown) {
          finish(new Error(String(error)))
        }
      }
    })
  }

  /**
   * Runs a queue.
   *
   * Creates a queue run and inserts it into the database.
   *
   * Creates a task run reader and passes the results to the task run writer.
   *
   * Updates the queue run and triggers dependant queues if all task runs have been triggered and have finished successfully.
   *
   * Normally, dependant queues will be triggered by the task runner when the last task has finished. But occasionally, e.g. when the generator query returns an empty result set, the queue runner has to trigger the dependant queues.
   *
   * Updates the queue run if an error occurred while triggering the task runs.
   *
   * @param queue - The queue
   * @param parameters - The parameters
   */
  public async run (queue: Queue, parameters?: Record<string, unknown>): Promise<void> {
    const queueRun = createQueueRun({
      queue
    })

    const { id: queueRunId } = await this.insertQueueRun(queueRun)

    queueRun.id = queueRunId

    try {
      await pipeline(
        await this.createTaskRunReader(queue, parameters),
        this.createTaskRunWriter(queueRun)
      )

      await this.updateQueueRunOk(queueRun)

      const queues = await this.selectQueues(queueRun)

      await Promise.all(queues.map(async ({ id }): Promise<number> => {
        return this.store.publish('queue-run', JSON.stringify({
          id,
          parameters: {
            id: queueRun.id
          }
        }))
      }))
    } catch (error: unknown) {
      try {
        await this.updateQueueRunErr(queueRun, error)
      } catch (updateError: unknown) {
        this.logger?.error({
          context: 'run'
        }, String(updateError))
      }
    }
  }

  /**
   * Inserts a queue run.
   *
   * @param queueRun - The queue run
   * @returns The insert result
   */
  protected async insertQueueRun (queueRun: QueueRun): Promise<InsertResult> {
    return this.database.insertOne<QueueRun>(sql`
      INSERT INTO queue_run (
        fkey_queue_id,
        name,
        options
      ) VALUES (
        $(fkey_queue_id),
        $(name),
        $(options)
      )
    `, {
      fkey_queue_id: queueRun.queue.id,
      name: queueRun.name,
      options: queueRun.options
    })
  }

  /**
   * Inserts a task run.
   *
   * @param queueRun - The queue run
   * @param payload - The payload of the task run
   * @returns The insert result
   */
  protected async insertTaskRun (queueRun: QueueRun, payload: unknown): Promise<InsertResult> {
    return this.database.insertOne<TaskRun>(sql`
      INSERT INTO task_run (
        fkey_queue_run_id,
        payload
      ) VALUES (
        $(fkey_queue_run_id),
        $(payload)
      )
    `, {
      fkey_queue_run_id: queueRun.id,
      payload
    })
  }

  /**
   * Selects queues.
   *
   * Applies the following criteria:
   *
   * * `queue.fkey_queue_id = queue_run.fkey_queue_id`
   * * `queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total`
   *
   * @param queueRun - The queue run
   * @returns The queues
   */
  protected async selectQueues (queueRun: QueueRun): Promise<Queue[]> {
    return this.database.selectAll<QueueRun, Queue>(sql`
      SELECT queue.id
      FROM queue
      JOIN queue_run ON queue.fkey_queue_id = queue_run.fkey_queue_id
      WHERE
        queue_run.id = $(id) AND
        queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total
    `, {
      id: queueRun.id
    })
  }

  /**
   * Updates a queue run.
   *
   * Sets `status` to 'err' and `reason` to the error message.
   *
   * @param queueRun - The queue run
   * @param error - The error
   * @returns The update result
   */
  protected async updateQueueRunErr (queueRun: QueueRun, error: unknown): Promise<UpdateResult> {
    return this.database.update<QueueRun>(sql`
      UPDATE queue_run
      SET
        status = 'err',
        date_updated = NOW(),
        reason = $(reason)
      WHERE id = $(id)
    `, {
      id: queueRun.id,
      reason: String(error)
    })
  }

  /**
   *  Updates a queue run.
   *
   * Sets `status` to 'ok' and `aggr_total` to the total of task runs which have been triggered.
   *
   * @param queueRun - The queue run
   * @returns The update result
   */
  protected async updateQueueRunOk (queueRun: QueueRun): Promise<UpdateResult> {
    return this.database.update<QueueRun>(sql`
      UPDATE queue_run
      SET
        aggr_total = $(aggr_total),
        status = 'ok',
        date_updated = NOW()
      WHERE id = $(id)
    `, {
      aggr_total: queueRun.aggr_total,
      id: queueRun.id
    })
  }
}
