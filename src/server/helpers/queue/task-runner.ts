import type { Item, Queue, QueueRun, TaskRun } from '../../entities'
import { Duplex } from 'stream'
import type { DuplexOptions } from 'stream'
import type { FastifyLoggerInstance } from 'fastify'
import type { PostgresqlDatabase } from '../sql/postgresql'
import type { Queuer } from './queuer'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'

export interface TaskRunnerOptions extends DuplexOptions {
  block: number
  channel: string
  consumer: string
  database: PostgresqlDatabase
  group: string
  logger: FastifyLoggerInstance
  maxLength: number
  name: string
  queue: WrappedNodeRedisClient
  queuer: Queuer
}

export class TaskRunner extends Duplex {
  public static options?: Partial<TaskRunnerOptions>

  public block: number

  public channel: string

  public consumer: string

  public data: TaskRun[] = []

  public database: PostgresqlDatabase

  public group: string

  public logger?: FastifyLoggerInstance

  public maxLength: number

  public name: string

  public options: Partial<TaskRunnerOptions>

  public pending = 0

  public queue: WrappedNodeRedisClient

  public queueRead: WrappedNodeRedisClient

  public xid = '0-0'

  public constructor (options: Partial<TaskRunnerOptions>) {
    super({
      objectMode: true,
      ...options
    })

    const {
      block = 5 * 60 * 1000,
      channel = 'queue',
      consumer = process.env.HOSTNAME ?? '',
      database,
      group,
      logger,
      maxLength = 1024 * 1024,
      name,
      queue,
      queuer
    } = {
      ...TaskRunner.options,
      ...options
    }

    if (database === undefined) {
      throw new Error('Database is undefined')
    }

    if (name === undefined) {
      throw new Error('Name is undefined')
    }

    if (queue === undefined) {
      throw new Error('Queue is undefined')
    }

    this.block = block
    this.channel = channel
    this.consumer = consumer
    this.database = database
    this.group = group ?? name
    this.logger = logger?.child({ name, source: 'task-runner' })
    this.maxLength = maxLength
    this.name = name
    this.queue = queue
    this.queueRead = createNodeRedisClient(queue.nodeRedis.duplicate())

    queuer?.add(this)
  }

  public _read (size: number): void {
    const taskRun = this.data.shift()

    if (taskRun !== undefined) {
      this
        .pushTaskRun(taskRun)
        .catch((error: unknown) => {
          this.logger?.error({ context: 'read' }, String(error))
        })

      return
    }

    this
      .readTaskRuns(size)
      .then(() => {
        this._read(size)
      })
      .catch(async (error: unknown) => {
        const message = String(error)
        const createGroup = message
          .toLowerCase()
          .includes('no such key')

        if (createGroup) {
          await this.createGroup()
          this._read(size)
        } else {
          this.logger?.error({ context: 'read' }, String(error))
        }
      })
  }

  public _write (taskRun: TaskRun, encoding: string, callback: () => void): void {
    this
      .writeTaskRun(taskRun)
      .then(() => {
        callback()
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'write' }, String(error))
        callback()
      })
  }

  public async stop (): Promise<void> {
    this.queueRead.end()

    while (this.pending > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100)
      })
    }
  }

  protected async createGroup (): Promise<void> {
    try {
      await this.queueRead.xgroup([['CREATE', [this.name, this.group]], '$', 'MKSTREAM'])
    } catch (error: unknown) {
      this.logger?.error({ context: 'create-group' }, String(error))
    }
  }

  protected async pushTaskRun (taskRun: TaskRun): Promise<void> {
    await this.database.query(`
      UPDATE task_run
      SET
        date_started = NOW(),
        date_updated = NOW(),
        xid = $(xid)
      WHERE id = $(id)
    `, {
      id: taskRun.id,
      xid: taskRun.xid
    })

    this.push(taskRun)
  }

  protected async readTaskRuns (size: number): Promise<void> {
    const result = await this.queueRead.xreadgroup(
      ['GROUP', [this.group, this.consumer]],
      ['COUNT', size],
      ['BLOCK', this.block],
      'STREAMS',
      [this.name],
      this.xid
    ) as Array<[string, string[] | null]> | null

    const items = result?.[0][1] ?? []

    if (items.length === 0) {
      this.xid = '>'
      return
    }

    const connection = await this.database.connect()

    try {
      for (const [xid, [, value]] of items) {
        const taskRun = await connection.selectOne<TaskRun>(`
          SELECT
            fkey_item_id,
            fkey_queue_run_id,
            id,
            code,
            name,
            options,
            "order",
            reason,
            result,
            xid
          FROM task_run
          WHERE id = $(id)
        `, {
          id: value
        })

        if (taskRun === undefined) {
          continue
        }

        const item = await connection.selectOne<Item>(`
          SELECT
            fkey_queue_run_id,
            id,
            code,
            payload
          FROM item
          WHERE id = $(id)
        `, {
          id: taskRun.fkey_item_id
        })

        if (item === undefined) {
          continue
        }

        const queueRun = await connection.selectOne<QueueRun>(`
          SELECT
            fkey_queue_id,
            id,
            name
          FROM queue_run
          WHERE id = $(id)
        `, {
          id: taskRun.fkey_queue_run_id
        })

        if (queueRun === undefined) {
          continue
        }

        taskRun.item = item
        taskRun.queueRun = queueRun
        taskRun.xid = xid

        await connection.query(`
          UPDATE task_run
          SET
            date_queued = NOW(),
            date_updated = NOW(),
            xid = $(xid)
          WHERE id = $(id)
        `, {
          id: taskRun.id,
          xid: taskRun.xid
        })

        this.data.push(taskRun)
        this.pending += 1
        this.xid = this.xid === '>' ? '>' : xid
      }
    } finally {
      connection.release()
    }
  }

  protected async writeTaskRun (taskRun: TaskRun): Promise<void> {
    const connection = await this.database.connect()

    try {
      taskRun.code = taskRun.code === 'pending' ? 'ok' : taskRun.code
      taskRun.item.code = taskRun.code

      await connection.query(`
        UPDATE task_run
        SET
          date_updated = NOW(),
          code = $(code),
          reason = $(reason),
          result = $(result)
        WHERE id = $(id)
      `, {
        code: taskRun.code,
        id: taskRun.id,
        reason: taskRun.reason,
        result: taskRun.result
      })

      await connection.query(`
        UPDATE item
        SET
          date_updated = NOW(),
          code = $(code)
        WHERE id = $(id)
      `, {
        code: taskRun.item.code,
        id: taskRun.item.id
      })

      if (typeof taskRun.xid === 'string') {
        await this.queue.xack(this.name, this.group, taskRun.xid)
      }

      let nextTaskRun = null

      if (taskRun.code === 'ok') {
        nextTaskRun = await connection.selectOne<Pick<TaskRun, 'id' | 'name'>>(`
          SELECT
            id,
            name
          FROM task_run
          WHERE fkey_item_id = $(fkey_item_id)
          AND "order" > $(order)
          LIMIT 1
        `, {
          fkey_item_id: taskRun.item.id,
          order: taskRun.order
        }) ?? null
      }

      if (nextTaskRun === null) {
        const field = taskRun.code === 'ok' ? 'ok' : 'err'

        await connection.query(`
          UPDATE queue_run
          SET
            aggr_${field} = aggr_${field} + 1,
            date_updated = NOW()
          WHERE id = $(id)
        `, {
          id: taskRun.queueRun.id
        })

        const queues = await connection.select<Queue[]>(`
          SELECT queue.id
          FROM queue
          LEFT JOIN queue_run
          ON queue.fkey_queue_id = queue_run.fkey_queue_id
          WHERE queue_run.id = $(queue_run_id)
          AND queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total
        `, {
          queue_run_id: taskRun.queueRun.id
        })

        for (const { id } of queues) {
          await this.queue.publish(this.channel, JSON.stringify({
            id,
            parameters: [taskRun.queueRun.id]
          }))
        }
      } else {
        await this.queue.xadd(
          `${taskRun.queueRun.name}-${nextTaskRun.name}`,
          ['MAXLEN', ['~', this.maxLength]],
          '*',
          ['taskRunId', String(nextTaskRun.id)]
        )
      }
    } finally {
      this.pending -= 1
      connection.release()
    }
  }
}
