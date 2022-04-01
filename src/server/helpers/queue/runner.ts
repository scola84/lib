import { PassThrough, Writable } from 'stream'
import type { Queue, QueueRun, QueueTask } from '../../entities'
import type { Readable } from 'stream'
import type { RedisClientType } from 'redis'
import type { SqlDatabase } from '../sql'
import type { Struct } from '../../../common'
import { createQueueRun } from '../../entities'
import { pipeline } from '../stream'
import { sql } from '../sql'
import { toString } from '../../../common'

export interface QueueRunnerOptions {
  /**
   * The database containing the queues.
   *
   * @see {@link SqlDatabase}
   */
  database: SqlDatabase

  /**
   * The databases to run generator queries on.
   *
   * @see {@link SqlDatabase}
   */
  databases: Partial<Struct<SqlDatabase>>

  /**
   * The store.
   *
   * @see https://www.npmjs.com/package/redis
   */
  store: RedisClientType
}

/**
 * Runs a queue.
 */
export class QueueRunner {
  /**
   * The database containing the queues.
   *
   * @see {@link SqlDatabase}
   */
  public database: SqlDatabase

  /**
   * The databases to run generator queries on.
   *
   * @see {@link SqlDatabase}
   */
  public databases: Partial<Struct<SqlDatabase>>

  /**
   * The store to write.
   *
   * @see https://www.npmjs.com/package/redis
   */
  public store: RedisClientType

  /**
   * Creates a queue runner.
   *
   * @param options - The queue runner options
   */
  public constructor (options: QueueRunnerOptions) {
    this.database = options.database
    this.databases = options.databases
    this.store = options.store
  }

  /**
   * Creates a task reader.
   *
   * Returns a PassThrough if the parameters contain a `payload`. The PassThrough emits the payload exactly once.
   *
   * Executes the generator query of the queue as a stream otherwise.
   *
   * @param queue - The queue
   * @param parameters - The parameters
   * @returns The reader
   */
  public async createQueueTaskReader (queue: Queue, parameters?: Struct): Promise<Readable> {
    if (parameters?.payload !== undefined) {
      const reader = new PassThrough({
        objectMode: true
      })

      reader.end(parameters.payload)
      return reader
    }

    const database = this.databases[queue.database ?? '']

    if (database === undefined) {
      throw new Error(`Database "${queue.database ?? ''}" is undefined`)
    }

    return database.stream(queue.query ?? '', parameters)
  }

  /**
   * Creates a task writer.
   *
   * The writer receives a payload and inserts a task based on the queue run and the payload into the database.
   *
   * The writer pushes the ID of the task at the tail of the store list at `name` of the queue run.
   *
   * The writer increments `aggr_total` of the queue run with `1`.
   *
   * @param run - The queue run
   * @returns The writer
   */
  public createQueueTaskWriter (run: QueueRun): Writable {
    return new Writable({
      objectMode: true,
      write: async (payload: unknown, encoding, finish) => {
        try {
          run.aggr_total += 1
          await this.store.rPush(run.name, (await this.insertQueueTask(run, payload)).id.toString())
          finish()
        } catch (error: unknown) {
          finish(new Error(toString(error)))
        }
      }
    })
  }

  /**
   * Runs a queue.
   *
   * Creates a queue run and inserts it into the database.
   *
   * Creates a task reader and passes the results to the task writer.
   *
   * Updates the queue run and triggers dependant queues if all tasks have been triggered and have finished successfully.
   *
   * Normally, dependant queues will be triggered by the task handler when the last task has finished. But occasionally, e.g. when the generator query returns an empty result set, the queue runner has to trigger the dependant queues.
   *
   * Updates the queue run if an error occurred while triggering the tasks.
   *
   * @param queue - The queue
   * @param parameters - The parameters
   */
  public async run (queue: Queue, parameters?: Struct): Promise<void> {
    const run = createQueueRun({
      queue
    })

    run.id = (await this.insertQueueRun(run)).id

    try {
      await pipeline(
        await this.createQueueTaskReader(queue, parameters),
        this.createQueueTaskWriter(run)
      )

      await this.updateQueueRunTotal(run)

      const queues = await this.selectQueues(run)

      await Promise.all(queues.map(async ({ id }): Promise<void> => {
        await this.store.publish('queue', JSON.stringify({
          command: 'run',
          id: id,
          parameters: {
            id: run.id
          }
        }))
      }))
    } catch (error: unknown) {
      await this.updateQueueRunErr(run, error)
    }
  }

  /**
   * Inserts a queue run.
   *
   * @param run - The queue run
   * @returns The insert result
   */
  protected async insertQueueRun (run: QueueRun): Promise<Pick<QueueRun, 'id'>> {
    return this.database.insert<QueueRun, Pick<QueueRun, 'id'>>(sql`
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
      fkey_queue_id: run.queue.id,
      name: run.name,
      options: run.options
    })
  }

  /**
   * Inserts a task.
   *
   * @param run - The queue run
   * @param payload - The payload of the task
   * @returns The insert result
   */
  protected async insertQueueTask (run: QueueRun, payload: unknown): Promise<Pick<QueueTask, 'id'>> {
    return this.database.insert<QueueTask, Pick<QueueTask, 'id'>>(sql`
      INSERT INTO queue_task (
        fkey_queue_run_id,
        payload
      ) VALUES (
        $(fkey_queue_run_id),
        $(payload)
      )
    `, {
      fkey_queue_run_id: run.id,
      payload: payload
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
   * @param run - The queue run
   * @returns The queues
   */
  protected async selectQueues (run: QueueRun): Promise<Array<Pick<Queue, 'id'>>> {
    return this.database.selectAll<QueueRun, Pick<Queue, 'id'>>(sql`
      SELECT queue.id
      FROM queue
      JOIN queue_run ON queue.fkey_queue_id = queue_run.fkey_queue_id
      WHERE
        queue_run.id = $(id) AND
        queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total
    `, {
      id: run.id
    })
  }

  /**
   * Updates a queue run.
   *
   * Sets `status` to 'err' and `reason` to the error message.
   *
   * @param run - The queue run
   * @param error - The error
   */
  protected async updateQueueRunErr (run: QueueRun, error: unknown): Promise<void> {
    await this.database.update<QueueRun>(sql`
      UPDATE queue_run
      SET
        status = 'err',
        date_updated = NOW(),
        reason = $(reason)
      WHERE id = $(id)
    `, {
      id: run.id,
      reason: toString(error)
    })
  }

  /**
   *  Updates a queue run.
   *
   * Sets `aggr_total` to the total of tasks which have been triggered.
   *
   * @param run - The queue run
   */
  protected async updateQueueRunTotal (run: QueueRun): Promise<void> {
    await this.database.update<QueueRun>(sql`
      UPDATE queue_run
      SET
        aggr_total = $(aggr_total),
        date_updated = NOW()
      WHERE id = $(id)
    `, {
      aggr_total: run.aggr_total,
      id: run.id
    })
  }
}
