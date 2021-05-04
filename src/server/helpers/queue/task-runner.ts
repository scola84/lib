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
import { sql } from '../sql'
import waitUntil from 'async-wait-until'

export interface SqlTaskRun<Payload = unknown, Options = unknown, Result = unknown> extends TaskRun<Payload, Options, Result> {
  sql: Connection
}

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

  public setup (): void {
    this.queue = this.createQueue()
    this.storeDuplicate = this.createStoreDuplicate()
    this.validator = this.createValidator()

    this.storeDuplicate.nodeRedis.on('error', (error) => {
      this.logger?.error({ context: 'setup' }, String(error))
    })
  }

  public start (setup = true): void {
    this.logger?.info({
      block: this.block,
      channel: this.channel,
      concurrency: this.concurrency,
      consumer: this.consumer,
      group: this.group,
      maxLength: this.maxLength
    }, 'Starting task runner')

    if (setup) {
      this.setup()
    }

    this.read()
  }

  public async stop (): Promise<void> {
    this.logger?.info({
      connected: [
        this.store.nodeRedis.connected,
        this.storeDuplicate?.nodeRedis.connected
      ],
      idle: this.queue?.idle(),
      queue: this.queue?.length()
    }, 'Stopping task runner')

    await this.delConsumer()
    this.storeDuplicate?.end()

    await waitUntil(() => {
      return this.queue?.idle() === true
    }, {
      timeout: Number.POSITIVE_INFINITY
    })
  }

  public validate<Data = unknown> (name: string, data?: Data): Data {
    if (data === undefined) {
      throw new Error('Data is undefined')
    }

    const schema = this.validator?.getSchema(name)

    if (schema === undefined) {
      throw new Error(`Schema "${name}" is undefined`)
    }

    if (schema(data) === false) {
      const error = schema.errors?.[0]
      throw new Error(`${name}${error?.instancePath ?? ''} ${error?.message ?? ''}`)
    }

    return data
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
    taskRun.sql = await this.database.connect()
    taskRun.code = taskRun.code === 'pending' ? 'ok' : taskRun.code
    taskRun.item.code = taskRun.code

    await this.updateTaskRunOnFinish(taskRun)
    await this.updateItem(taskRun)

    if (taskRun.xid !== null) {
      await this.store.xack(this.name, this.group, taskRun.xid)
    }

    const nextTaskRun = taskRun.code === 'ok'
      ? await this.selectTaskRunOnFinish(taskRun)
      : undefined

    if (nextTaskRun === undefined) {
      await this.updateQueueRun(taskRun)
      const queues = await this.selectQueues(taskRun) ?? []

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
  }

  protected async handleTaskRun (taskRun: TaskRun): Promise<void> {
    try {
      await this.startTaskRun(taskRun)
    } catch (error: unknown) {
      taskRun.code = 'err'
      taskRun.reason = String(error)
    } finally {
      try {
        taskRun.sql?.release()
        delete taskRun.sql
        await this.finishTaskRun(taskRun)
      } catch (error: unknown) {
        this.logger?.error({ context: 'handle-task-run' }, String(error))
      } finally {
        taskRun.sql?.release()
        delete taskRun.sql
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

        if ((/connection lost/ui).test(String(error))) {
          await waitUntil(() => {
            return this.store.nodeRedis.connected
          }, {
            timeout: this.block
          })

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

    await Promise.all(items.map(async ([xid, [, id]]): Promise<void> => {
      this.xid = this.xid === '>' ? '>' : xid
      const connection = await this.database.connect()

      try {
        const taskRun = await this.selectTaskRunOnRead(Number(id), connection)

        if (taskRun === undefined) {
          throw new Error(`Task run "${id}" is undefined`)
        }

        taskRun.sql = connection
        taskRun.xid = xid

        const [
          item,
          queueRun,
          task
        ] = await Promise.all([
          this.selectItem(taskRun),
          this.selectQueueRun(taskRun),
          this.selectTask(taskRun)
        ])

        if (item === undefined || queueRun === undefined || task === undefined) {
          throw new Error(`Properties of task run "${id}" are undefined`)
        }

        taskRun.item = item
        taskRun.queueRun = queueRun
        taskRun.task = task

        await this.updateTaskRunOnRead(taskRun)
        this.queue?.push(taskRun)
      } catch (error: unknown) {
        connection.release()
        this.logger?.error({ context: 'read-task-runs' }, String(error))
      }
    }))
  }

  protected async selectItem (taskRun: TaskRun): Promise<Item | undefined> {
    return taskRun.sql?.selectOne<Item, Item>(sql`
      SELECT *
      FROM item
      WHERE id = $(id)
    `, {
      id: taskRun.fkey_item_id
    })
  }

  protected async selectQueueRun (taskRun: TaskRun): Promise<QueueRun | undefined> {
    return taskRun.sql?.selectOne<QueueRun, QueueRun>(sql`
      SELECT *
      FROM queue_run
      WHERE id = $(id)
    `, {
      id: taskRun.fkey_queue_run_id
    })
  }

  protected async selectQueues (taskRun: TaskRun): Promise<Queue[] | undefined> {
    return taskRun.sql?.select<QueueRun, Queue[]>(sql`
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

  protected async selectTask (taskRun: TaskRun): Promise<Task | undefined> {
    return taskRun.sql?.selectOne<Task, Task>(sql`
      SELECT *
      FROM task
      WHERE id = $(id)
    `, {
      id: taskRun.fkey_task_id
    })
  }

  protected async selectTaskRunOnFinish (taskRun: TaskRun): Promise<Task & TaskRun | undefined> {
    return taskRun.sql?.selectOne<Task & TaskRun, Task & TaskRun>(sql`
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

  protected async selectTaskRunOnRead (id: number, connection: Connection): Promise<TaskRun | undefined> {
    return connection.selectOne<TaskRun, TaskRun>(sql`
      SELECT *
      FROM task_run
      WHERE id = $(id)
    `, {
      id
    })
  }

  protected async startTaskRun (taskRun: TaskRun): Promise<void> {
    await this.updateTaskRunOnStart(taskRun)

    taskRun.sql?.release()
    delete taskRun.sql

    if (taskRun.code === 'pending') {
      if (this.validator?.getSchema('options') !== undefined) {
        this.validate('options', taskRun.task.options)
      }

      if (this.validator?.getSchema('payload') !== undefined) {
        this.validate('payload', taskRun.item.payload)
      }

      await this.run(taskRun)
    }
  }

  protected async updateItem (taskRun: TaskRun): Promise<UpdateResult | undefined> {
    return taskRun.sql?.update<Item>(sql`
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

  protected async updateQueueRun (taskRun: TaskRun): Promise<UpdateResult | undefined> {
    return taskRun.sql?.update<QueueRun>(sql`
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

  protected async updateTaskRunOnFinish (taskRun: TaskRun): Promise<UpdateResult | undefined> {
    return taskRun.sql?.update<TaskRun | { result: string }>(sql`
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

  protected async updateTaskRunOnRead (taskRun: TaskRun): Promise<UpdateResult | undefined> {
    return taskRun.sql?.update<TaskRun>(sql`
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

  protected async updateTaskRunOnStart (taskRun: TaskRun): Promise<UpdateResult | undefined> {
    return taskRun.sql?.update<TaskRun>(sql`
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
