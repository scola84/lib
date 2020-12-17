import {
  Item,
  Queue,
  QueueRun,
  TaskRun
} from '../../entities'

import {
  MoreThan,
  getManager
} from 'typeorm'

import { Duplex } from 'stream'
import type { EntityManager } from 'typeorm'
import type { FastifyLoggerInstance } from 'fastify'
import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'

export interface TaskRunnerOptions {
  block: number
  consumer: string
  count: number
  entityManager: string
  group: string
  logger: FastifyLoggerInstance
  maxLength: number
  name: string
  queueClient: RedisOptions
  xid: string
}

export class TaskRunner extends Duplex {
  public static options?: Partial<TaskRunnerOptions>

  public block: number

  public consumer: string

  public count: number

  public entityManager?: EntityManager

  public group: string

  public logger?: FastifyLoggerInstance

  public maxLength: string[]

  public name: string

  public options: Partial<TaskRunnerOptions>

  public readClient: Redis.Redis

  public writeClient: Redis.Redis

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
    this.logger?.debug('Finish task %o', taskRun.item.payload)

    try {
      taskRun.code = taskRun.code === 'pending'
        ? 'ok'
        : taskRun.code
      taskRun.item.code = taskRun.code

      await this.updateTaskRunAfter(taskRun)
      await this.updateItemState(taskRun.item)

      if (taskRun.xid !== null) {
        await this.writeClient.xack(this.name, this.group, taskRun.xid)
      }

      if (taskRun.code === 'ok') {
        await this.addNextTaskRun(taskRun)
      } else {
        await this.updateQueueRunState(taskRun.queueRun, taskRun)
        await this.runNextQueues(taskRun.queueRun, taskRun)
      }
    } catch (error: unknown) {
      this.logger?.error({ context: '_write' }, String(error))
    }

    callback()
  }

  public start (): void {
    const {
      block = 60 * 60 * 1000,
      consumer = process.env.HOSTNAME ?? '',
      count = 1,
      entityManager,
      group,
      logger,
      maxLength,
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

    if (entityManager !== undefined) {
      this.entityManager = getManager(entityManager)
    }

    this.block = block
    this.consumer = consumer
    this.count = count
    this.group = group ?? name
    this.name = name
    this.readClient = new Redis(queueClient)
    this.writeClient = new Redis(queueClient)
    this.xid = xid

    this.logger = logger?.child({
      name,
      source: 'task-runner'
    })

    this.maxLength = maxLength === undefined
      ? []
      : ['MAXLEN', '~', String(maxLength)]

    this
      .createGroup()
      .then(() => {
        this
          .readTaskRuns()
          .catch((error: unknown) => {
            this.logger?.error({ context: 'run' }, String(error))
          })
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'group' }, String(error))
      })
  }

  protected async addNextTaskRun (taskRun: TaskRun): Promise<void> {
    const nextTaskRun = await this.entityManager?.findOne(TaskRun, {
      where: {
        item: {
          id: taskRun.item.id
        },
        order: MoreThan(taskRun.order)
      }
    })

    if (nextTaskRun instanceof TaskRun) {
      const name = `${taskRun.queueRun.name}-${nextTaskRun.name}`
      await this.writeClient.xadd(name, ...this.maxLength, '*', ['taskRunId', nextTaskRun.id])
      this.logger?.debug({ name }, 'Enqueue task %o', taskRun.item.payload)
    } else {
      await this.updateQueueRunState(taskRun.queueRun, taskRun)
      await this.runNextQueues(taskRun.queueRun, taskRun)
    }
  }

  protected async createGroup (): Promise<void> {
    try {
      const infoGroups = await this.readClient.xinfo('GROUPS', this.name) as []
      const exists = infoGroups.some((infoGroup: unknown[]) => {
        return infoGroup[1] === this.group
      })

      if (!exists) {
        await this.readClient.xgroup('CREATE', this.name, this.group, '$')
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'ERR no such key') {
        await this.readClient.xgroup('CREATE', this.name, this.group, '$', 'MKSTREAM')
        return
      }

      throw error
    }
  }

  protected async pushItem (itemId: string, xid: string): Promise<void> {
    const taskRun = await this.entityManager?.findOne(TaskRun, itemId, {
      relations: [
        'item',
        'queueRun'
      ]
    })

    if (taskRun instanceof TaskRun) {
      taskRun.started = new Date()
      taskRun.xid = xid

      await this.updateTaskRunBefore(taskRun)

      this.logger?.debug('Start task %o', taskRun.item.payload)
      this.push(taskRun)
    }
  }

  protected pushPayload (payload: unknown, xid: string): void {
    const item = new Item()
    item.payload = payload

    const taskRun = new TaskRun()
    taskRun.item = item
    taskRun.xid = xid

    this.logger?.debug('Start task %o', payload)
    this.push(taskRun)
  }

  protected async readTaskRuns (): Promise<void> {
    for (;;) {
      const result = await this.readClient.xreadgroup(
        'GROUP',
        this.group,
        this.consumer,
        'COUNT',
        this.count,
        'BLOCK',
        this.block,
        'STREAMS',
        this.name,
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
    }
  }

  protected async runNextQueues (queueRun: QueueRun, taskRun: TaskRun): Promise<void> {
    const nextQueues = await this.entityManager
      ?.createQueryBuilder()
      .select('queue')
      .from(Queue, 'queue')
      .innerJoin('queue_run', 'queueRun', 'queueRun.queueId = queue.previousQueueId')
      .where('queueRun.id = :id', taskRun.queueRun)
      .andWhere('queueRun.ok + queueRun.err = queueRun.total')
      .getMany() ?? []

    for (const { id } of nextQueues) {
      await this.writeClient.publish('queue', JSON.stringify({
        id,
        payload: [queueRun.id]
      }))
    }
  }

  protected async updateItemState (item: Item): Promise<void> {
    await this.entityManager
      ?.createQueryBuilder()
      .update(Item)
      .set({
        code: item.code
      })
      .where({
        id: item.id
      })
      .execute()
  }

  protected async updateQueueRunState (queueRun: QueueRun, taskRun: TaskRun): Promise<void> {
    const field = taskRun.code === 'ok'
      ? 'ok'
      : 'err'

    await this.entityManager
      ?.createQueryBuilder()
      .update(QueueRun)
      .set({
        [field]: () => {
          return `${field} + 1`
        }
      })
      .where({
        id: queueRun.id
      })
      .execute()
  }

  protected async updateTaskRunAfter (taskRun: TaskRun): Promise<void> {
    await this.entityManager
      ?.createQueryBuilder()
      .update(TaskRun)
      .set({
        code: taskRun.code,
        reason: taskRun.reason
      })
      .where({
        id: taskRun.id
      })
      .execute()
  }

  protected async updateTaskRunBefore (taskRun: TaskRun): Promise<void> {
    await this.entityManager
      ?.createQueryBuilder()
      .update(TaskRun)
      .set({
        started: taskRun.started,
        xid: taskRun.xid
      })
      .where({
        id: taskRun.id
      })
      .execute()
  }
}
