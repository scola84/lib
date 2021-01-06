import type { Queue, QueueRun } from '../../entities'
import type { Database } from '../sql'
import type { FastifyLoggerInstance } from 'fastify'
import type { PostgresqlDatabase } from '../sql/postgresql'
import { Transform } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { XAdder } from '../redis'
import { pipeline } from '../stream'

export interface QueueRunnerOptions {
  database: PostgresqlDatabase
  databases: Record<string, Database | undefined>
  highWaterMark: number
  logger: FastifyLoggerInstance
  maxLength: number
  queue: WrappedNodeRedisClient
}

export class QueueRunner {
  public static options?: Partial<QueueRunnerOptions>

  public database: PostgresqlDatabase

  public databases: Record<string, Database | undefined>

  public errored: Error | null

  public highWaterMark?: number

  public logger?: FastifyLoggerInstance

  public maxLength: number

  public options: Partial<QueueRunnerOptions>

  public queue: WrappedNodeRedisClient

  public constructor (options: Partial<QueueRunnerOptions>) {
    const {
      database,
      databases,
      highWaterMark,
      logger,
      maxLength = 1024 * 1024,
      queue
    } = {
      ...QueueRunner.options,
      ...options
    }

    if (database === undefined) {
      throw new Error('Database is undefined')
    }

    if (databases === undefined) {
      throw new Error('Databases are undefined')
    }

    if (queue === undefined) {
      throw new Error('Queue is undefined')
    }

    this.database = database
    this.databases = databases
    this.highWaterMark = highWaterMark
    this.maxLength = maxLength
    this.queue = queue

    this.logger = logger?.child({
      source: 'queue-runner'
    })
  }

  public async run (queue: Queue, parameters: unknown[] = []): Promise<void> {
    const connection = await this.database.connect()

    const { id: queueRunId = '0' } = await connection.insertOne(`
      INSERT INTO queue_run (fkey_queue_id, name)
      VALUES ($(fkey_queue_id), $(name))
      RETURNING id
    `, {
      fkey_queue_id: queue.id,
      name: queue.name
    })

    const queueRun: QueueRun = {
      aggr_err: 0,
      aggr_ok: 0,
      aggr_total: 0,
      fkey_queue_id: queue.id,
      id: queueRunId,
      name: queue.name,
      queue
    }

    const database = this.databases[queue.connection ?? '']

    if (database === undefined) {
      throw new Error('Database is undefined')
    }

    const reader = await database.stream(queue.query ?? '', parameters)

    const inserter = new Transform({
      objectMode: true,
      transform: async (payload: unknown, encoding, callback) => {
        const { id: itemId } = await connection.insertOne(`
          INSERT INTO item (fkey_queue_run_id, payload)
          VALUES ($(fkey_queue_run_id), $(payload))
          RETURNING id
        `, {
          fkey_queue_run_id: queueRun.id,
          payload
        })

        const firstTask = {
          name: '',
          value: ['', '']
        }

        for (const task of queueRun.queue.tasks) {
          const { id: taskRunId = '0' } = await connection.insertOne(`
            INSERT INTO task_run (fkey_item_id, fkey_queue_run_id, name, options, "order")
            VALUES ($(fkey_item_id), $(fkey_queue_run_id), $(name), $(options), $(order))
            RETURNING id
          `, {
            fkey_item_id: itemId,
            fkey_queue_run_id: queueRun.id,
            name: task.name,
            options: task.options,
            order: task.order
          })

          if (task.order === 1) {
            firstTask.name = `${queueRun.name}-${task.name}`
            firstTask.value = ['taskRunId', String(taskRunId)]
          }
        }

        queueRun.aggr_total += 1
        callback(null, firstTask)
      }
    })

    const xadder = new XAdder({
      highWaterMark: this.highWaterMark,
      maxLength: this.maxLength,
      queue: this.queue
    })

    await pipeline(reader, inserter, xadder)
      .then(async () => {
        await connection.query(`
          UPDATE queue_run
          SET
            date_updated = NOW(),
            aggr_total = $(aggr_total)
          WHERE id = $(id)
        `, {
          aggr_total: queueRun.aggr_total,
          id: queueRun.id
        })

        const queues = await connection.select<Queue[]>(`
          SELECT queue.id
          FROM queue
          LEFT JOIN queue_run
          ON queue.fkey_queue_id = queue_run.fkey_queue_id
          WHERE queue_run.id = $(queue_run_id)
          AND queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total
        `, {
          queue_run_id: queueRun.id
        })

        for (const { id } of queues) {
          await this.queue.publish('queue', JSON.stringify({
            id,
            parameters: [queueRun.id]
          }))
        }
      })
      .catch((error) => {
        this.logger?.error({ context: 'run' }, String(error))
      })
      .finally(() => {
        connection.release()
      })
  }
}
