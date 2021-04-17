import type { Connection, Database, InsertResult, UpdateResult } from '../sql'
import type { Item, Queue, QueueRun, TaskRun } from '../../entities'
import type { Logger } from 'pino'
import { Transform } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { XAdder } from '../redis'
import { createQueueRun } from '../../entities'
import { pipeline } from '../stream'

export interface QueueRunnerOptions {
  database: Database
  databases: Record<string, Database | undefined>
  highWaterMark: number
  logger?: Logger
  maxLength: number
  store: WrappedNodeRedisClient
}

export class QueueRunner {
  public database: Database

  public databases: Record<string, Database | undefined>

  public highWaterMark: number

  public logger?: Logger

  public maxLength: number

  public store: WrappedNodeRedisClient

  public constructor (options: QueueRunnerOptions) {
    this.database = options.database
    this.databases = options.databases
    this.highWaterMark = options.highWaterMark
    this.logger = options.logger?.child({ name: 'queue-runner' })
    this.maxLength = options.maxLength
    this.store = options.store
  }

  public createAdder (): XAdder {
    return new XAdder({
      highWaterMark: this.highWaterMark,
      maxLength: this.maxLength,
      store: this.store
    })
  }

  public createInserter (connection: Connection, queueRun: QueueRun): Transform {
    return new Transform({
      objectMode: true,
      transform: async (payload: unknown, encoding, finish) => {
        try {
          const { id: itemId } = await this.insertItem(connection, queueRun, payload)

          const [firstTask] = await Promise.all(queueRun.queue.tasks.map(async (task) => {
            const { id: taskRunId = '0' } = await this.insertTaskRun(connection, queueRun.id, itemId, task.id)

            return {
              name: `${queueRun.name}-${task.name}`,
              value: ['id', String(taskRunId)]
            }
          }))

          queueRun.aggr_total += 1
          finish(null, firstTask)
        } catch (error: unknown) {
          finish(error as Error)
        }
      }
    })
  }

  public async run (queue: Queue, parameters: unknown[] = []): Promise<void> {
    const connection = await this.database.connect()
    const { id: queueRunId = 0 } = await this.insertQueueRun(connection, queue)
    const queueRun: QueueRun = createQueueRun(queueRunId, queue)
    const database = this.databases[queue.connection ?? '']

    try {
      if (database === undefined) {
        throw new Error('Database is undefined')
      }

      const inserter = this.createInserter(connection, queueRun)
      const reader = await database.stream(queue.query ?? '', parameters)
      const xadder = this.createAdder()

      await pipeline(reader, inserter, xadder)
      await this.updateQueueRunOk(connection, queueRun)

      const queues = await this.selectQueues(connection, queueRun)

      await Promise.all(queues.map(async ({ id }): Promise<number> => {
        return this.store.publish('queue', JSON.stringify({
          id,
          parameters: [queueRun.id]
        }))
      }))
    } catch (error: unknown) {
      try {
        await this.updateQueueRunErr(connection, queueRun, error as Error)
      } catch (updateError: unknown) {
        this.logger?.error({ context: 'run' }, String(updateError))
      }
    } finally {
      connection.release()
    }
  }

  protected async insertItem (connection: Connection, queueRun: QueueRun, payload: unknown): Promise<InsertResult> {
    return connection.insertOne<Item>(`
      INSERT INTO item (
        fkey_queue_run_id,
        payload
      ) VALUES (
        $(fkey_queue_run_id),
        $(payload)
      )
    `, {
      fkey_queue_run_id: queueRun.id,
      payload: JSON.stringify(payload)
    })
  }

  protected async insertQueueRun (connection: Connection, queue: Queue): Promise<InsertResult> {
    return connection.insertOne<QueueRun>(`
      INSERT INTO queue_run (
        fkey_queue_id,
        name
      ) VALUES (
        $(fkey_queue_id),
        $(name)
      )
    `, {
      fkey_queue_id: queue.id,
      name: queue.name
    })
  }

  protected async insertTaskRun (connection: Connection, queueRunId: number, itemId: number, taskId: number): Promise<InsertResult> {
    return connection.insertOne<TaskRun>(`
      INSERT INTO task_run (
        fkey_item_id,
        fkey_queue_run_id,
        fkey_task_id
      ) VALUES (
        $(fkey_item_id),
        $(fkey_queue_run_id),
        $(fkey_task_id)
      )
    `, {
      fkey_item_id: itemId,
      fkey_queue_run_id: queueRunId,
      fkey_task_id: taskId
    })
  }

  protected async selectQueues (connection: Connection, queueRun: QueueRun): Promise<Queue[]> {
    return connection.select<QueueRun, Queue[]>(`
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

  protected async updateQueueRunErr (connection: Connection, queueRun: QueueRun, error: Error): Promise<UpdateResult> {
    return connection.update<QueueRun>(`
      UPDATE queue_run
      SET
        code = 'err',
        date_updated = NOW(),
        reason = $(reason)
      WHERE id = $(id)
    `, {
      id: queueRun.id,
      reason: String(error)
    })
  }

  protected async updateQueueRunOk (connection: Connection, queueRun: QueueRun): Promise<UpdateResult> {
    return connection.update<QueueRun>(`
      UPDATE queue_run
      SET
        aggr_total = $(aggr_total),
        code = 'ok',
        date_updated = NOW()
      WHERE id = $(id)
    `, {
      aggr_total: queueRun.aggr_total,
      id: queueRun.id
    })
  }
}
