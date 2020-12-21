import type {
  Item,
  Queue,
  QueueRun,
  TaskRun
} from '../../entities'

import type { ClientOpts } from 'redis'
import type { FastifyLoggerInstance } from 'fastify'
import type { IDatabase } from 'pg-promise'
import type { Readable } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { Writable } from 'stream'
import { createNodeRedisClient } from 'handy-redis'

export interface QueueRunnerOptions {
  database: IDatabase<unknown>
  logger: FastifyLoggerInstance
  maxLength: number
  queueClient: ClientOpts
  stream: (queue: Queue, parameters: unknown[]) => Promise<Readable>
}

export class QueueRunner extends Writable {
  public static options?: Partial<QueueRunnerOptions>

  public database?: IDatabase<unknown>

  public errored: Error | null

  public logger?: FastifyLoggerInstance

  public maxLength?: number

  public options: Partial<QueueRunnerOptions>

  public queueClient: WrappedNodeRedisClient

  public queueRun: QueueRun

  public stream: (queue: Queue, parameters: unknown[]) => Promise<Readable>

  public constructor (options?: Partial<QueueRunnerOptions>) {
    super({
      autoDestroy: false,
      objectMode: true
    })

    this.options = {
      ...QueueRunner.options,
      ...options
    }
  }

  public async _final (callback: () => void): Promise<void> {
    try {
      await this.updateQueueRunTotal(this.queueRun)
      await this.runNextQueues(this.queueRun)
    } catch (error: unknown) {
      this.logger?.error({ context: 'final' }, String(error))
    }

    callback()
  }

  public async _write (payload: unknown, encoding: string, callback: () => void): Promise<void> {
    try {
      const item: Item = {
        code: 'pending',
        payload,
        queueRun: this.queueRun,
        queue_run_id: this.queueRun.id
      }

      if (Array.isArray(item.queueRun.taskRuns)) {
        await this.writeItem(item)
      } else {
        await this.writePayload(payload)
      }

      this.queueRun.total += 1
    } catch (error: unknown) {
      this.logger?.error({ context: 'write' }, String(error))
    }

    callback()
  }

  public async run (queue: Queue, payload?: unknown): Promise<void> {
    const item = {
      payload,
      queueRun: this.queueRun
    }

    this.queueRun = {
      name: queue.name,
      queue,
      taskRuns: queue.tasks?.map((task) => {
        return {
          code: 'pending',
          item,
          name: task.name,
          options: task.options,
          order: task.order,
          queueRun: this.queueRun
        }
      }),
      total: 0
    }

    const { id = '0' } = await this.database
      ?.one<QueueRun>(`
        INSERT INTO queue_run
          (created, err, name, ok, total, updated, queue_id)
        VALUES
          (NOW(), 0, $(name), 0, 0, NOW(), $(queue_id))
        RETURNING
          id
      `, {
        name: this.queueRun.name,
        queue_id: this.queueRun.queue.id
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'run-insert-queue-run' }, String(error))
        return undefined
      }) ?? {}

    this.queueRun.id = id

    if (queue.query === null || queue.connection === null) {
      this.write(payload)
      return
    }

    const parameters = Array.isArray(payload)
      ? payload
      : []

    const stream = await this
      .stream(queue, parameters)
      .catch((error: unknown) => {
        this.logger?.error({ context: 'run-stream-request' }, String(error))
        return undefined
      })

    if (stream === undefined) {
      return
    }

    const handleEnd = (): void => {
      stream.removeListener('error', handleError)
      this.queueClient.quit().catch(() => {})
    }

    const handleError = (error: unknown): void => {
      stream.removeListener('end', handleEnd)
      stream.unpipe(this)
      stream.destroy()
      this.logger?.error({ context: 'run-stream-handle' }, String(error))
      this.queueClient.quit().catch(() => {})
    }

    stream
      .once('error', handleError)
      .once('end', handleEnd)
      .pipe(this)
  }

  public start (): void {
    const {
      database,
      logger,
      maxLength,
      queueClient,
      stream
    } = this.options

    if (queueClient === undefined) {
      throw new Error('Queue client is undefined')
    }

    if (stream === undefined) {
      throw new Error('Stream is undefined')
    }

    if (database !== undefined) {
      this.database = database
    }

    if (maxLength !== undefined) {
      this.maxLength = maxLength
    }

    this.queueClient = createNodeRedisClient(queueClient)
    this.stream = stream

    this.logger = logger?.child({
      source: 'queue-runner'
    })

    this.on('error', (error: unknown) => {
      this.logger?.error({ context: 'self' }, String(error))
      this.errored = null
    })
  }

  protected async runNextQueues (queueRun: QueueRun): Promise<void> {
    const nextQueues = await this.database
      ?.manyOrNone<Queue>(`
        SELECT queue.id
        FROM queue
        LEFT JOIN queue_run ON queue.previous_queue_id = queue_run.queue_id
        WHERE queue_run.id = $(queue_run_id)
        AND queue_run.ok + queue_run.err = queue_run.total
      `, {
        queue_run_id: queueRun.id
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'run-next-queues-select' }, String(error))
        return []
      }) ?? []

    Promise
      .all(nextQueues.map(async ({ id }) => {
        await this.queueClient.publish('queue', JSON.stringify({
          id,
          payload: [queueRun.id]
        }))
      }))
      .catch((error: unknown) => {
        this.logger?.error({ context: 'run-next-queues-publish' }, String(error))
      })
  }

  protected async updateQueueRunTotal (queueRun: QueueRun): Promise<void> {
    await this.database
      ?.none(`
        UPDATE queue_run
        SET
          total = $(total),
          updated = NOW()
        WHERE id = $(queue_run_id)
      `, {
        queue_run_id: queueRun.id,
        total: queueRun.total
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'update-queue-run-total' }, String(error))
      })
  }

  protected async writeItem (item: Item): Promise<void> {
    let nextTaskRunId = '0'
    let nextTaskRunName = ''

    await this.database
      ?.tx(async (task) => {
        const { id: itemId } = await task
          .one<Item>(`
            INSERT INTO item (code, created, payload, updated, queue_run_id)
            VALUES ($(code), NOW(), $(payload), NOW(), $(queue_run_id))
            RETURNING id
          `, {
            code: item.code,
            payload: item.payload,
            queue_run_id: item.queueRun.id
          })
          .catch((error: unknown) => {
            this.logger?.error({ context: 'write-item-insert-item' }, String(error))
            return { id: '0' }
          })

        task
          .batch(this.queueRun.taskRuns?.map(async (taskRun) => {
            return await task
              .one<TaskRun>(`
                INSERT INTO task_run (code, created, name, options, "order", updated,
                  item_id, queue_run_id)
                VALUES ($(code), NOW(), $(name), $(options), $(order), NOW(),
                  $(item_id), $(queue_run_id))
                RETURNING id
              `, {
                code: taskRun.code,
                item_id: itemId,
                name: taskRun.name,
                options: taskRun.options,
                order: taskRun.order,
                queue_run_id: this.queueRun.id
              })
              .then(({ id: taskRunId }) => {
                if (taskRun.order === 1) {
                  nextTaskRunId = taskRunId ?? '0'
                  nextTaskRunName = `${this.queueRun.name}-${taskRun.name}`
                }
                return taskRun
              })
              .catch((error: unknown) => {
                this.logger?.error({ context: 'write-item-insert-task-run' }, String(error))
              })
          }) ?? [])
          .catch((error: unknown) => {
            this.logger?.error({ context: 'write-item-batch' }, String(error))
          })
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'write-item-tx' }, String(error))
      })

    if (this.maxLength === undefined) {
      this.queueClient
        .xadd(
          nextTaskRunName,
          '*',
          ['taskRunId', String(nextTaskRunId)]
        )
        .catch((error: unknown) => {
          this.logger?.error({ context: 'write-item-xadd' }, String(error))
        })
    } else {
      this.queueClient
        .xadd(
          nextTaskRunName,
          ['MAXLEN', ['~', this.maxLength]],
          '*',
          ['taskRunId', String(nextTaskRunId)]
        )
        .catch((error: unknown) => {
          this.logger?.error({ context: 'write-item-xadd' }, String(error))
        })
    }
  }

  protected async writePayload (payload: unknown): Promise<void> {
    if (this.maxLength === undefined) {
      await this.queueClient
        .xadd(
          this.queueRun.name,
          '*',
          ['payload', JSON.stringify(payload)]
        )
        .catch((error: unknown) => {
          this.logger?.error({ context: 'write-payload-xadd' }, String(error))
        })
    } else {
      await this.queueClient
        .xadd(
          this.queueRun.name,
          ['MAXLEN', ['~', this.maxLength]],
          '*',
          ['payload', JSON.stringify(payload)]
        )
        .catch((error: unknown) => {
          this.logger?.error({ context: 'write-payload-xadd' }, String(error))
        })
    }
  }
}
