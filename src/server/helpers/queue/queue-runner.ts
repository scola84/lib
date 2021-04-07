import type { Item, Queue, QueueRun, TaskRun } from '../../entities'
import type { Database } from '../sql'
import type { Logger } from 'pino'
import { Transform } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { XAdder } from '../redis'
import { pipeline } from '../stream'

export interface QueueRunnerOptions {
  database: Database
  databases: Record<string, Database | undefined>
  highWaterMark: number
  logger: Logger
  maxLength: number
  queueWriter: WrappedNodeRedisClient
}

export class QueueRunner {
  public static options?: Partial<QueueRunnerOptions>

  public database: Database

  public databases: Record<string, Database | undefined>

  public highWaterMark?: number

  public logger: Logger

  public maxLength: number

  public queueWriter: WrappedNodeRedisClient

  public constructor (coptions: Partial<QueueRunnerOptions>) {
    const options = {
      ...QueueRunner.options,
      ...coptions
    }

    if (options.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (options.databases === undefined) {
      throw new Error('Option "databases" is undefined')
    }

    if (options.logger === undefined) {
      throw new Error('Option "logger" is undefined')
    }

    if (options.queueWriter === undefined) {
      throw new Error('Option "queueWriter" is undefined')
    }

    this.database = options.database
    this.databases = options.databases
    this.highWaterMark = options.highWaterMark
    this.logger = options.logger.child({ name: 'queue-runner' })
    this.maxLength = options.maxLength ?? 1024 * 1024
    this.queueWriter = options.queueWriter
  }

  public createAdder (): XAdder {
    return new XAdder({
      highWaterMark: this.highWaterMark,
      maxLength: this.maxLength,
      queueWriter: this.queueWriter
    })
  }

  public async run (queue: Queue, parameters: unknown[] = []): Promise<void> {
    const connection = await this.database.connect()

    const { id: queueRunId = 0 } = await connection.insertOne<QueueRun>(`
      INSERT INTO queue_run (fkey_queue_id,name)
      VALUES ($(fkey_queue_id),$(name))
    `, {
      fkey_queue_id: queue.id,
      name: queue.name
    })

    const queueRun: QueueRun = {
      aggr_err: 0,
      aggr_ok: 0,
      aggr_total: 0,
      code: 'pending',
      date_created: new Date(),
      date_updated: new Date(),
      fkey_queue_id: queue.id,
      id: queueRunId,
      name: queue.name,
      queue,
      reason: null
    }

    const database = this.databases[queue.connection ?? '']

    if (database === undefined) {
      throw new Error('Database is undefined')
    }

    const inserter = new Transform({
      objectMode: true,
      transform: async (payload: unknown, encoding, callback) => {
        try {
          const { id: itemId } = await connection.insertOne<Item | { payload: string }>(`
            INSERT INTO item (fkey_queue_run_id,payload)
            VALUES ($(fkey_queue_run_id),$(payload))
          `, {
            fkey_queue_run_id: queueRun.id,
            payload: JSON.stringify(payload)
          })

          const firstTask = {
            name: '',
            value: ['', '']
          }

          for (const task of queueRun.queue.tasks) {
            const { id: taskRunId = '0' } = await connection.insertOne<TaskRun | { options: string }>(`
              INSERT INTO task_run (fkey_item_id,fkey_queue_run_id,fkey_task_id)
              VALUES ($(fkey_item_id),$(fkey_queue_run_id),$(fkey_task_id))
            `, {
              fkey_item_id: itemId,
              fkey_queue_run_id: queueRun.id,
              fkey_task_id: task.id
            })

            if (task.number === 1) {
              firstTask.name = `${queueRun.name}-${task.name}`
              firstTask.value = ['taskRunId', String(taskRunId)]
            }
          }

          queueRun.aggr_total += 1
          callback(null, firstTask)
        } catch (error: unknown) {
          callback(new Error(`Transform error: ${String(error)}`))
        }
      }
    })

    const reader = await database.stream(queue.query ?? '', parameters)
    const xadder = this.createAdder()

    try {
      await pipeline(reader, inserter, xadder)

      await connection.update<QueueRun>(`
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

      const queues = await connection.select<QueueRun, Queue[]>(`
        SELECT queue.id
        FROM queue
        JOIN queue_run
        ON queue.fkey_queue_id = queue_run.fkey_queue_id
        WHERE queue_run.id = $(id)
        AND queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total
      `, {
        id: queueRun.id
      })

      for (const { id } of queues) {
        await this.queueWriter.publish('queue', JSON.stringify({
          id,
          parameters: [queueRun.id]
        }))
      }
    } catch (error: unknown) {
      try {
        await connection.update<QueueRun>(`
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
      } catch (updateError: unknown) {
        this.logger.error({ context: 'run' }, String(updateError))
      }
    } finally {
      connection.release()
    }
  }
}
