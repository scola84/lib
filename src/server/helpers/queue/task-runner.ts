import type { Connection, Database, UpdateResult } from '../sql'
import type { DuplexOptions, Readable, Transform, Writable } from 'stream'
import type { Item, Queue, QueueRun, Task, TaskRun } from '../../entities'
import Ajv from 'ajv'
import type { Logger } from 'pino'
import type { ObjectSchema } from 'fluent-json-schema'
import type { Queuer } from './queuer'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import type { queue as fastq } from 'fastq'
import { pipeline } from '../stream'
import { promise } from 'fastq'
import waitUntil from 'async-wait-until'

export interface TaskRunnerOptions extends DuplexOptions {
  block: number
  channel: string
  concurrency: number | string
  consumer: string
  database: Database
  group: string
  logger?: Logger
  maxLength: number
  name: string
  queuer: Queuer
  schema: Record<string, ObjectSchema>
  store: WrappedNodeRedisClient
  xid: string
}

export abstract class TaskRunner {
  public static options?: Partial<TaskRunnerOptions>

  public block: number

  public channel: string

  public concurrency: number

  public consumer: string

  public database: Database

  public group: string

  public logger?: Logger

  public maxLength: number

  public name: string

  public queue?: fastq

  public schema: Record<string, ObjectSchema>

  public store: WrappedNodeRedisClient

  public storeDuplicate?: WrappedNodeRedisClient

  public validator?: Ajv

  public xid: string

  public constructor (coptions: Partial<TaskRunnerOptions>) {
    const options = {
      ...TaskRunner.options,
      ...coptions
    }

    if (options.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (options.name === undefined) {
      throw new Error('Option "name is undefined')
    }

    if (options.store === undefined) {
      throw new Error('Option "store" is undefined')
    }

    this.block = options.block ?? 5 * 60 * 1000
    this.channel = options.channel ?? 'queue'
    this.concurrency = Number(options.concurrency ?? process.env.QUEUE_CONCURRENCY ?? 1)
    this.consumer = options.consumer ?? process.env.HOSTNAME ?? ''
    this.database = options.database
    this.group = options.group ?? options.name
    this.logger = options.logger?.child({ name: options.name })
    this.maxLength = options.maxLength ?? 1024 * 1024
    this.name = options.name
    this.schema = options.schema ?? {}
    this.store = options.store
    this.xid = options.xid ?? '0-0'

    options.queuer?.add(this)
  }

  public createQueue (): fastq {
    const queuer = promise<unknown, TaskRun>(async (taskRun) => {
      return this.handleTaskRun(taskRun)
    }, this.concurrency)

    queuer.empty = () => {
      this.read()
    }

    return queuer
  }

  public createStoreDuplicate (): WrappedNodeRedisClient {
    return createNodeRedisClient(this.store.nodeRedis.duplicate())
  }

  public createValidator (): Ajv {
    const validator = new Ajv()

    for (const name of Object.keys(this.schema)) {
      validator.addSchema(this.schema[name].valueOf(), name)
    }

    return validator
  }

  public async pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
    return pipeline(...streams)
  }

  public start (): void {
    this.logger?.info({
      block: this.block,
      channel: this.channel,
      concurrency: this.concurrency,
      consumer: this.consumer,
      group: this.group,
      maxLength: this.maxLength
    }, 'Starting task runner')

    this.queue = this.createQueue()
    this.storeDuplicate = this.createStoreDuplicate()
    this.validator = this.createValidator()

    this.read()
  }

  public async stop (): Promise<void> {
    this.logger?.info({
      connected: [
        this.store.nodeRedis.connected,
        this.storeDuplicate?.nodeRedis.connected
      ],
      queue: this.queue?.length()
    }, 'Stopping task runner')

    await this.delConsumer()
    this.storeDuplicate?.end()

    await waitUntil(() => {
      return this.queue?.length() === 0
    })
  }

  public validate (name: string, data: unknown): void {
    const schema = this.validator?.getSchema(name)

    if (schema?.(data) === false) {
      const error = schema.errors?.[0]
      throw new Error(`${name}${error?.instancePath ?? ''} ${error?.message ?? ''}`)
    }
  }

  protected async createGroup (): Promise<void> {
    try {
      await this.store.xgroup([['CREATE', [this.name, this.group]], '$', 'MKSTREAM'])
    } catch (error: unknown) {
      this.logger?.error({ context: 'create-group' }, String(error))
    }
  }

  protected async delConsumer (): Promise<void> {
    try {
      await this.store.xgroup(['DELCONSUMER', [this.name, this.group, this.consumer]])
    } catch (error: unknown) {
      this.logger?.error({ context: 'del-consumer' }, String(error))
    }
  }

  protected async finishTaskRun (taskRun: TaskRun): Promise<void> {
    const connection = await this.database.connect()

    try {
      taskRun.code = taskRun.code === 'pending' ? 'ok' : taskRun.code
      taskRun.item.code = taskRun.code

      await this.updateTaskRunOnFinish(connection, taskRun)
      await this.updateItem(connection, taskRun)

      if (taskRun.xid !== null) {
        await this.store.xack(this.name, this.group, taskRun.xid)
      }

      const nextTaskRun = taskRun.code === 'ok'
        ? await this.selectTaskRunOnFinish(connection, taskRun)
        : undefined

      if (nextTaskRun === undefined) {
        await this.updateQueueRun(connection, taskRun)
        const queues = await this.selectQueues(connection, taskRun)

        await Promise.all(queues.map(async ({ id }) => {
          await this.store.publish(this.channel, JSON.stringify({
            id,
            parameters: [taskRun.queueRun.id]
          }))
        }))
      } else {
        await this.store.xadd(
          `${taskRun.queueRun.name}-${nextTaskRun.name}`,
          ['MAXLEN', ['~', this.maxLength]],
          '*',
          ['id', String(nextTaskRun.id)]
        )
      }
    } finally {
      connection.release()
    }
  }

  protected async handleTaskRun (taskRun: TaskRun): Promise<void> {
    try {
      await this.startTaskRun(taskRun)
    } catch (error: unknown) {
      taskRun.code = 'err'
      taskRun.reason = String(error)
    } finally {
      try {
        await this.finishTaskRun(taskRun)
      } catch (error: unknown) {
        this.logger?.error({ context: 'handle-task-run' }, String(error))
      }
    }
  }

  protected read (): void {
    this
      .readTaskRuns()
      .then(() => {
        if (this.queue?.length() === 0) {
          this.read()
        }
      })
      .catch(async (error: unknown) => {
        if ((/no such key/ui).test(String(error))) {
          await this.createGroup()
          this.read()
          return
        }

        this.logger?.error({ context: 'read' }, String(error))
      })
  }

  protected async readGroup (): Promise<Array<[string, string[] | null]> | null> {
    return this.storeDuplicate?.xreadgroup(
      ['GROUP', [this.group, this.consumer]],
      ['COUNT', this.concurrency],
      ['BLOCK', this.block],
      'STREAMS',
      [this.name],
      this.xid
    ) as Promise<Array<[string, string[] | null]> | null>
  }

  protected async readTaskRuns (): Promise<void> {
    const items = (await this.readGroup())?.[0][1] ?? []

    if (items.length === 0) {
      this.xid = '>'
      return
    }

    const connection = await this.database.connect()

    await Promise.all(items.map(async ([xid, [, id]]): Promise<void> => {
      try {
        const taskRun = await this.selectTaskRunOnRead(connection, Number(id))

        if (taskRun !== undefined) {
          const [
            item,
            queueRun,
            task
          ] = await Promise.all([
            this.selectItem(connection, taskRun),
            this.selectQueueRun(connection, taskRun),
            this.selectTask(connection, taskRun)
          ])

          if (
            item !== undefined &&
            queueRun !== undefined &&
            task !== undefined
          ) {
            taskRun.item = item
            taskRun.queueRun = queueRun
            taskRun.task = task
            taskRun.xid = xid

            await this.updateTaskRunOnRead(connection, taskRun)
            this.queue?.push(taskRun)

            this.xid = this.xid === '>' ? '>' : xid
          }
        }
      } catch (error: unknown) {
        this.logger?.error({ context: 'read-task-runs' }, String(error))
      }
    }))

    connection.release()
  }

  protected async selectItem (connection: Connection, taskRun: TaskRun): Promise<Item | undefined> {
    return connection.selectOne<Item, Item>(`
      SELECT *
      FROM item
      WHERE id = $(id)
    `, {
      id: taskRun.fkey_item_id
    })
  }

  protected async selectQueueRun (connection: Connection, taskRun: TaskRun): Promise<QueueRun | undefined> {
    return connection.selectOne<QueueRun, QueueRun>(`
      SELECT *
      FROM queue_run
      WHERE id = $(id)
    `, {
      id: taskRun.fkey_queue_run_id
    })
  }

  protected async selectQueues (connection: Connection, taskRun: TaskRun): Promise<Queue[]> {
    return connection.select<QueueRun, Queue[]>(`
      SELECT queue.id
      FROM queue
      JOIN queue_run ON queue.fkey_queue_id = queue_run.fkey_queue_id
      WHERE
        queue_run.id = $(id) AND
        queue_run.fkey_item_id = $(fkey_item_id) AND
        queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total
    `, {
      fkey_item_id: taskRun.item.id,
      id: taskRun.queueRun.id
    })
  }

  protected async selectTask (connection: Connection, taskRun: TaskRun): Promise<Task | undefined> {
    return connection.selectOne<Task, Task>(`
      SELECT *
      FROM task
      WHERE id = $(id)
    `, {
      id: taskRun.fkey_task_id
    })
  }

  protected async selectTaskRunOnFinish (connection: Connection, taskRun: TaskRun): Promise<Task & TaskRun | undefined> {
    return connection.selectOne<Task & TaskRun, Task & TaskRun>(`
      SELECT
        task_run.id,
        task.name
      FROM task_run
      JOIN task ON task_run.fkey_task_id = task.id
      WHERE
        fkey_item_id = $(fkey_item_id) AND
        task.number > $(number)
      ORDER BY task.number ASC
      LIMIT 1
    `, {
      fkey_item_id: taskRun.item.id,
      number: taskRun.task.number
    })
  }

  protected async selectTaskRunOnRead (connection: Connection, id: number): Promise<TaskRun | undefined> {
    return connection.selectOne<TaskRun, TaskRun>(`
      SELECT *
      FROM task_run
      WHERE id = $(id)
    `, {
      id
    })
  }

  protected async startTaskRun (taskRun: TaskRun): Promise<void> {
    await this.updateTaskRunOnStart(taskRun)

    if (taskRun.code === 'pending') {
      this.validate('options', taskRun.task.options)
      this.validate('payload', taskRun.item.payload)
      await this.run(taskRun)
    }
  }

  protected async updateItem (connection: Connection, taskRun: TaskRun): Promise<UpdateResult> {
    return connection.update<Item>(`
      UPDATE item
      SET
        code = $(code),
        date_updated = NOW()
      WHERE id = $(id)
    `, {
      code: taskRun.item.code,
      id: taskRun.item.id
    })
  }

  protected async updateQueueRun (connection: Connection, taskRun: TaskRun): Promise<UpdateResult> {
    return connection.update<QueueRun>(`
      UPDATE queue_run
      SET
        aggr_${taskRun.code} = aggr_${taskRun.code} + 1,
        date_updated = NOW(),
        fkey_item_id = $(fkey_item_id)
      WHERE id = $(id)
    `, {
      fkey_item_id: taskRun.item.id,
      id: taskRun.queueRun.id
    })
  }

  protected async updateTaskRunOnFinish (connection: Connection, taskRun: TaskRun): Promise<UpdateResult> {
    return connection.update<TaskRun | { result: string }>(`
      UPDATE task_run
      SET
        code = $(code),
        date_updated = NOW(),
        reason = $(reason),
        result = $(result)
      WHERE id = $(id)
    `, {
      code: taskRun.code,
      id: taskRun.id,
      reason: taskRun.reason,
      result: taskRun.result
    })
  }

  protected async updateTaskRunOnRead (connection: Connection, taskRun: TaskRun): Promise<UpdateResult> {
    return connection.update<TaskRun>(`
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
  }

  protected async updateTaskRunOnStart (taskRun: TaskRun): Promise<UpdateResult> {
    return this.database.update<TaskRun>(`
      UPDATE task_run
      SET
        consumer = $(consumer),
        date_started = NOW(),
        date_updated = NOW(),
        xid = $(xid)
      WHERE id = $(id)
    `, {
      consumer: this.consumer,
      id: taskRun.id,
      xid: taskRun.xid
    })
  }

  protected abstract run (taskRun: TaskRun): Promise<void>
}
