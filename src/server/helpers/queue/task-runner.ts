import type {
  Item,
  Queue,
  QueueRun,
  TaskRun
} from '../../entities'

import type { ClientOpts } from 'redis'
import { Duplex } from 'stream'
import type { FastifyLoggerInstance } from 'fastify'
import type { IDatabase } from 'pg-promise'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'

export interface TaskRunnerOptions {
  block: number
  consumer: string
  count: number
  database: IDatabase<unknown>
  group: string
  logger: FastifyLoggerInstance
  name: string
  queueClient: ClientOpts
  xid: string
}

export class TaskRunner extends Duplex {
  public static options?: Partial<TaskRunnerOptions>

  public block: number

  public consumer: string

  public count: number

  public database?: IDatabase<unknown>

  public group: string

  public logger?: FastifyLoggerInstance

  public name: string

  public options: Partial<TaskRunnerOptions>

  public readClient: WrappedNodeRedisClient

  public writeClient: WrappedNodeRedisClient

  public xid: string

  public constructor (options?: Partial<TaskRunnerOptions>) {
    super({
      objectMode: true
    })

    this.options = {
      ...TaskRunner.options,
      ...options
    }
  }

  public _read (): void {}

  public async _write (taskRun: TaskRun, encoding: string, callback: () => void): Promise<void> {
    try {
      taskRun.code = taskRun.code === 'pending' ? 'ok' : taskRun.code
      taskRun.item.code = taskRun.code

      await this.updateTaskRunAfter(taskRun)
      await this.updateItemState(taskRun.item)

      if (typeof taskRun.xid === 'string') {
        await this.writeClient
          .xack(this.name, this.group, taskRun.xid)
          .catch((error: unknown) => {
            this.logger?.error({ context: 'write-ack' }, String(error))
          })
      }

      if (taskRun.code === 'ok') {
        await this.addNextTaskRun(taskRun)
      } else {
        await this.updateQueueRunState(taskRun.queueRun, taskRun)
        await this.runNextQueues(taskRun.queueRun, taskRun)
      }
    } catch (error: unknown) {
      this.logger?.error({ context: 'write' }, String(error))
    }

    callback()
  }

  public start (): void {
    const {
      block = 60 * 60 * 1000,
      consumer = process.env.HOSTNAME ?? '',
      count = 1,
      database,
      group,
      logger,
      name,
      queueClient,
      xid = '>'
    } = this.options

    if (name === undefined) {
      throw new Error('Name is undefined')
    }

    if (queueClient === undefined) {
      throw new Error('Queue client is undefined')
    }

    if (database !== undefined) {
      this.database = database
    }

    this.block = block
    this.consumer = consumer
    this.count = count
    this.group = group ?? name
    this.name = name
    this.readClient = createNodeRedisClient(queueClient)
    this.writeClient = createNodeRedisClient(queueClient)
    this.xid = xid

    this.logger = logger?.child({
      name,
      source: 'task-runner'
    })

    this
      .createGroup()
      .then(() => {
        this
          .readTaskRuns()
          .catch((error: unknown) => {
            this.logger?.error({ context: 'run-read-task-runs' }, String(error))
          })
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'run-create-group' }, String(error))
      })
  }

  protected async addNextTaskRun (taskRun: TaskRun): Promise<void> {
    const nextTaskRun = await this.database
      ?.oneOrNone<TaskRun>(`
        SElECT *
        FROM task_run
        WHERE item_id = $(item_id)
        AND "order" > $(order)
        LIMIT 1
      `, {
        item_id: taskRun.item.id,
        order: taskRun.order
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'add-next-task-run' }, String(error))
      })

    if (nextTaskRun === null || nextTaskRun === undefined) {
      await this.updateQueueRunState(taskRun.queueRun, taskRun)
      await this.runNextQueues(taskRun.queueRun, taskRun)
    } else {
      const name = `${taskRun.queueRun.name}-${nextTaskRun.name}`
      await this.writeNextTaskRun(name, nextTaskRun.id)
    }
  }

  protected async createGroup (): Promise<void> {
    try {
      const infoGroups = await this.readClient.xinfo(['GROUPS', this.name]) as []
      const exists = infoGroups.some((infoGroup: unknown[]) => {
        return infoGroup[1] === this.group
      })

      if (!exists) {
        await this.readClient.xgroup([['CREATE', [this.name, this.group]], '$'])
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'ERR no such key') {
        await this.readClient.xgroup([['CREATE', [this.name, this.group]], '$', 'MKSTREAM'])
        return
      }

      throw error
    }
  }

  protected async pushItem (taskRunId: string, xid: string): Promise<void> {
    const taskRun = await this.selectTaskRun(taskRunId)

    if (taskRun !== undefined) {
      taskRun.xid = xid
      await this.updateTaskRunBefore(taskRun)
      this.push(taskRun)
    }
  }

  protected pushPayload (payload: unknown, xid: string): void {
    const queueRun = {
      name: '',
      queue: {
        name: ''
      },
      total: 0
    }

    const taskRun: TaskRun = {
      code: 'pending',
      item: {
        payload,
        queueRun
      },
      name: this.name,
      options: {},
      order: 1,
      queueRun,
      xid
    }

    this.push(taskRun)
  }

  protected async readTaskRuns (): Promise<void> {
    for (;;) {
      try {
        const result = await this.readClient.xreadgroup(
          ['GROUP', [this.group, this.consumer]],
          ['COUNT', this.count],
          ['BLOCK', this.block],
          'STREAMS',
          [this.name],
          this.xid
        ) as Array<[string, string[] | null]> | null

        const items = result?.[0][1] ?? []

        if (items.length === 0) {
          this.xid = '>'
        }

        for (const [xid, [type, value]] of items) {
          if (type === 'payload') {
            this.pushPayload(value, xid)
          } else {
            await this.pushItem(value, xid)
          }

          this.xid = xid
        }
      } catch (error: unknown) {
        this.logger?.error({ context: 'read-task-runs' }, String(error))
      }
    }
  }

  protected async runNextQueues (queueRun: QueueRun, taskRun: TaskRun): Promise<void> {
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
        await this.writeClient.publish('queue', JSON.stringify({
          id,
          payload: [queueRun.id]
        }))
      }))
      .catch((error: unknown) => {
        this.logger?.error({ context: 'run-next-queues-publish' }, String(error))
      })
  }

  protected async selectTaskRun (taskRunId: string): Promise<TaskRun | undefined> {
    return await this.database?.task<TaskRun>(async (task): Promise<TaskRun> => {
      const taskRun = await task.one<TaskRun>(`
        SELECT *
        FROM task_run
        WHERE id = $(task_run_id)
      `, {
        task_run_id: taskRunId
      })

      taskRun.item = await task.one<Item>(`
        SELECT *
        FROM item
        WHERE id = $(item_id)
      `, {
        item_id: taskRun.item_id
      })

      taskRun.queueRun = await task.one<QueueRun>(`
        SELECT *
        FROM queue_run
        WHERE id = $(queue_run_id)
      `, {
        queue_run_id: taskRun.queue_run_id
      })

      return taskRun
    }).catch((error: unknown) => {
      this.logger?.error({ context: 'select-task-run' }, String(error))
      return undefined
    })
  }

  protected async updateItemState (item: Item): Promise<void> {
    await this.database
      ?.none(`
        UPDATE item
        SET
          code = $(code),
          updated = NOW()
        WHERE id = $(item_id)
      `, {
        code: item.code,
        item_id: item.id
      }).catch((error: unknown) => {
        this.logger?.error({ context: 'update-item-state' }, String(error))
      })
  }

  protected async updateQueueRunState (queueRun: QueueRun, taskRun: TaskRun): Promise<void> {
    const field = taskRun.code === 'ok' ? 'ok' : 'err'

    await this.database
      ?.none(`
        UPDATE queue_run
        SET
          ${field} = ${field} + 1,
          updated = NOW()
        WHERE id = $(queue_run_id)
      `, {
        queue_run_id: queueRun.id
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'update-queue-run-state' }, String(error))
      })
  }

  protected async updateTaskRunAfter (taskRun: TaskRun): Promise<void> {
    await this.database
      ?.none(`
        UPDATE task_run
        SET
          code = $(code), reason = $(reason),
          updated = NOW()
        WHERE id = $(task_run_id)
      `, {
        code: taskRun.code,
        reason: taskRun.reason,
        task_run_id: taskRun.id
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'update-task-run-after' }, String(error))
      })
  }

  protected async updateTaskRunBefore (taskRun: TaskRun): Promise<void> {
    await this.database
      ?.none(`
        UPDATE task_run
        SET
          started = NOW(),
          updated = NOW(),
          xid = $(xid)
        WHERE id = $(task_run_id)
      `, {
        task_run_id: taskRun.id,
        xid: taskRun.xid
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'update-task-run-before' }, String(error))
      })
  }

  protected async writeNextTaskRun (name: string, id?: string): Promise<void> {
    await this.writeClient
      .xadd(name, '*', ['taskRunId', String(id)])
      .catch((error: unknown) => {
        this.logger?.error({ context: 'write-next-task-run' }, String(error))
      })
  }
}
