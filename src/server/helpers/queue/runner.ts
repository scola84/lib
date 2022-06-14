import { PassThrough, Writable } from 'stream'
import type { Queue, Run, Struct, Task } from '../../../common'
import { ScolaError, createRun, toString } from '../../../common'
import type { Readable } from 'stream'
import type { RedisClientType } from 'redis'
import type { SqlDatabase } from '../sql'
import { pipeline } from '../stream'
import { sql } from '../sql'

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
  public async createTaskReader (queue: Queue, parameters?: Struct): Promise<Readable> {
    if (parameters?.payload !== undefined) {
      const reader = new PassThrough({
        objectMode: true
      })

      reader.end(parameters.payload)
      return reader
    }

    const database = this.databases[queue.db_name ?? '']

    if (database === undefined) {
      throw new ScolaError({
        code: 'err_queue',
        message: `Database "${queue.db_name ?? ''}" is undefined`
      })
    }

    return database.stream(queue.db_query ?? '', parameters)
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
  public createTaskWriter (run: Run): Writable {
    return new Writable({
      objectMode: true,
      write: (payload: unknown, encoding, finish) => {
        run.aggr_total += 1

        Promise
          .resolve()
          .then(async () => {
            return this.insertTask(run, payload)
          })
          .then(async (task) => {
            return this.store.rPush(run.name, task.task_id.toString())
          })
          .then(() => {
            finish()
          })
          .catch((error) => {
            finish(new Error(toString(error)))
          })
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
    const run = createRun({
      queue
    })

    run.run_id = (await this.insertRun(run)).run_id

    try {
      await pipeline(
        await this.createTaskReader(queue, parameters),
        this.createTaskWriter(run)
      )

      await this.updateRunTotal(run)

      const queues = await this.selectQueues(run)

      await Promise.all(queues.map(async (nextQueue): Promise<void> => {
        await this.store.publish('queue', JSON.stringify({
          command: 'run',
          parameters: {
            run_id: run.run_id
          },
          queue_id: nextQueue.queue_id
        }))
      }))
    } catch (error: unknown) {
      await this.updateRunErr(run, error)
    }
  }

  /**
   * Inserts a queue run.
   *
   * @param run - The queue run
   * @returns The insert result
   */
  protected async insertRun (run: Run): Promise<Pick<Run, 'run_id'>> {
    return this.database.insert<Run, Pick<Run, 'run_id'>>(sql`
      INSERT INTO run (
        queue_id,
        name,
        options
      ) VALUES (
        $(queue_id),
        $(name),
        $(options)
      )
    `, {
      name: run.name,
      options: run.options,
      queue_id: run.queue.queue_id
    }, 'run_id')
  }

  /**
   * Inserts a task.
   *
   * @param run - The queue run
   * @param payload - The payload of the task
   * @returns The insert result
   */
  protected async insertTask (run: Run, payload: unknown): Promise<Pick<Task, 'task_id'>> {
    return this.database.insert<Task, Pick<Task, 'task_id'>>(sql`
      INSERT INTO task (
        run_id,
        payload
      ) VALUES (
        $(run_id),
        $(payload)
      )
    `, {
      payload: payload,
      run_id: run.run_id
    }, 'task_id')
  }

  /**
   * Selects queues.
   *
   * Applies the following criteria:
   *
   * * `queue.queue_id = run.queue_id`
   * * `run.aggr_ok + run.aggr_err = run.aggr_total`
   *
   * @param run - The run
   * @returns The queues
   */
  protected async selectQueues (run: Run): Promise<Array<Pick<Queue, 'queue_id'>>> {
    return this.database.selectAll<Run, Pick<Queue, 'queue_id'>>(sql`
      SELECT queue.queue_id
      FROM queue
      JOIN run ON queue.parent_id = run.queue_id
      WHERE
        run.run_id = $(run_id) AND
        run.aggr_ok + run.aggr_err = run.aggr_total
    `, {
      run_id: run.run_id
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
  protected async updateRunErr (run: Pick<Run, 'run_id'>, error: unknown): Promise<void> {
    await this.database.update<Run>(sql`
      UPDATE run
      SET
        status = 'err',
        date_updated = NOW(),
        reason = $(reason)
      WHERE run_id = $(run_id)
    `, {
      reason: toString(error),
      run_id: run.run_id
    })
  }

  /**
   *  Updates a queue run.
   *
   * Sets `aggr_total` to the total of tasks which have been triggered.
   *
   * @param run - The queue run
   */
  protected async updateRunTotal (run: Pick<Run, 'aggr_total' | 'run_id'>): Promise<void> {
    await this.database.update<Run>(sql`
      UPDATE run
      SET
        aggr_total = $(aggr_total),
        date_updated = NOW()
      WHERE run_id = $(run_id)
    `, {
      aggr_total: run.aggr_total,
      run_id: run.run_id
    })
  }
}
