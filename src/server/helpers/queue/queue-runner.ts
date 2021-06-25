import type { Database, InsertResult, UpdateResult } from '../sql'
import type { Queue, QueueRun, TaskRun } from '../../entities'
import type { Logger } from 'pino'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { Writable } from 'stream'
import { createQueueRun } from '../../entities'
import { pipeline } from '../stream'
import { sql } from '../sql'

export interface QueueRunnerOptions {
  /**
   * The database containing the queues.
   */
  database: Database

  /**
   * The databases to run generator queries on.
   */
  databases: Record<string, Database | undefined>

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: Logger

  /**
   * The store to trigger task runs.
   */
  store: WrappedNodeRedisClient
}

/**
 * Runs a queue.
 */
export class QueueRunner {
  /**
   * The database containing the queues.
   */
  public database: Database

  /**
   * The databases to run generator queries on.
   */
  public databases: Record<string, Database | undefined>

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

  /**
   * The store to trigger task runs.
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
    this.logger = options.logger?.child({ name: 'queue-runner' })
    this.store = options.store
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
          const { id = 0 } = await this.insertTaskRun(queueRun, payload)
          await this.store.rpush(queueRun.name, String(id))
          queueRun.aggr_total += 1
          finish()
        } catch (error: unknown) {
          finish(error as Error)
        }
      }
    })
  }

  /**
   * Runs a queue.
   *
   * Creates a queue run and inserts it into the database.
   *
   * Executes the generator query of the queue as a stream and passes the results to the task writer.
   *
   * Updates the queue run and triggers dependant queues if all task runs have been triggered and have finished successfully.
   *
   * Normally, dependant queues will be triggered by the task runner when the last task has finished. But occasionally, e.g. when the generator query returns an empty result set, the queue runner has to trigger the dependant queues.
   *
   * Updates the queue run if an error occurred while triggering the task runs.
   *
   * @param queue - The queue
   * @param parameters - The parameters for the generator query
   */
  public async run (queue: Queue, parameters?: Record<string, unknown>): Promise<void> {
    const queueRun: QueueRun = createQueueRun({ queue })
    const { id: queueRunId } = await this.insertQueueRun(queueRun)
    queueRun.id = queueRunId

    try {
      const database = this.databases[queue.database ?? '']

      if (database === undefined) {
        throw new Error('Database is undefined')
      }

      await pipeline(
        await database.stream(queue.query ?? '', parameters),
        this.createTaskRunWriter(queueRun)
      )

      await this.updateQueueRunOk(queueRun)
      const queues = await this.selectQueues(queueRun)

      await Promise.all(queues.map(async ({ id }): Promise<number> => {
        return this.store.publish('queue', JSON.stringify({
          id,
          parameters: {
            id: queueRun.id
          }
        }))
      }))
    } catch (error: unknown) {
      try {
        await this.updateQueueRunErr(queueRun, error as Error)
      } catch (updateError: unknown) {
        this.logger?.error({ context: 'run' }, String(updateError))
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
   * Updates the queue run.
   *
   * Sets `status` to 'err' and `reason` to the error message.
   *
   * @param queueRun - The queue run
   * @param error - The error
   * @returns The update result
   */
  protected async updateQueueRunErr (queueRun: QueueRun, error: Error): Promise<UpdateResult> {
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
   *  Updates the queue run.
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
