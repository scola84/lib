import type { DuplexOptions, Readable, Transform, Writable } from 'stream'
import type { Item, Queue, QueueRun, TaskRun } from '../../entities'
import type { Database } from '../sql'
import type { Logger } from 'pino'
import type { Queuer } from './queuer'
import type { WrappedNodeRedisClient } from 'handy-redis'
import fastq from 'fastq'
import handyRedis from 'handy-redis'
import { pipeline } from '../stream'

export interface TaskRunnerOptions extends DuplexOptions {
  block: number
  channel: string
  concurrency: number | string
  consumer: string
  database: Database
  group: string
  logger: Logger
  maxLength: number
  name: string
  queue: WrappedNodeRedisClient
  queuer: Queuer
}

export abstract class TaskRunner {
  public static options?: Partial<TaskRunnerOptions>

  public block: number

  public channel: string

  public concurrency: number

  public consumer: string

  public data: TaskRun[] = []

  public database: Database

  public group: string

  public lib = {
    fastq,
    handyRedis
  }

  public logger: Logger

  public maxLength: number

  public name: string

  public queue: WrappedNodeRedisClient

  public queueRead?: WrappedNodeRedisClient

  public queuer: fastq.queue

  public xid = '0-0'

  public constructor (options: Partial<TaskRunnerOptions>) {
    const {
      block = 5 * 60 * 1000,
      channel = 'queue',
      consumer = process.env.HOSTNAME ?? '',
      database,
      concurrency = process.env.QUEUE_CONCURRENCY ?? 1,
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

    if (logger === undefined) {
      throw new Error('Logger is undefined')
    }

    if (name === undefined) {
      throw new Error('Name is undefined')
    }

    if (queue === undefined) {
      throw new Error('Queue is undefined')
    }

    this.block = block
    this.channel = channel
    this.concurrency = Number(concurrency)
    this.consumer = consumer
    this.database = database
    this.group = group ?? name
    this.logger = logger.child({ name })
    this.maxLength = maxLength
    this.name = name
    this.queue = queue

    queuer?.add(this)
  }

  public async pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
    return pipeline(...streams)
  }

  public start (): void {
    this.logger.info({
      block: this.block,
      channel: this.channel,
      concurrency: this.concurrency,
      consumer: this.consumer,
      group: this.group,
      maxLength: this.maxLength
    }, 'Starting')

    this.queuer = this.lib.fastq.promise<unknown, TaskRun>(async (taskRun) => {
      return this.handleTaskRun(taskRun)
    }, this.concurrency)

    this.queuer.empty = () => {
      this.read()
    }

    this.queueRead = this.lib.handyRedis.createNodeRedisClient(this.queue.nodeRedis.duplicate())
    this.read()
  }

  public async stop (): Promise<void> {
    this.logger.info('Stopping')

    await this.delConsumer()
    this.queueRead?.end()

    while (this.queuer.length() > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100)
      })
    }
  }

  protected async createGroup (): Promise<void> {
    try {
      await this.queue.xgroup([['CREATE', [this.name, this.group]], '$', 'MKSTREAM'])
    } catch (error: unknown) {
      this.logger.error({ context: 'create-group' }, String(error))
    }
  }

  protected async delConsumer (): Promise<void> {
    try {
      await this.queue.xgroup(['DELCONSUMER', [this.name, this.group, this.consumer]])
    } catch (error: unknown) {
      this.logger.error({ context: 'del-consumer' }, String(error))
    }
  }

  protected async handleTaskRun (taskRun: TaskRun): Promise<void> {
    try {
      await this.pushTaskRun(taskRun)
    } catch (error: unknown) {
      taskRun.code = 'err'
      taskRun.reason = String(error)
    } finally {
      try {
        await this.writeTaskRun(taskRun)
      } catch (error: unknown) {
        this.logger.error({ context: 'handle-task-run' }, String(error))
      }
    }
  }

  protected async pushTaskRun (taskRun: TaskRun): Promise<void> {
    await this.database.update(`
      UPDATE task_run
      SET
        consumer = $1,
        date_started = NOW(),
        date_updated = NOW(),
        xid = $2
      WHERE id = $3
    `, [
      this.consumer,
      taskRun.xid,
      taskRun.id
    ])

    if (taskRun.code === 'pending') {
      await this.run(taskRun)
    }
  }

  protected read (): void {
    this
      .readTaskRuns()
      .then(() => {
        if (this.queuer.length() === 0) {
          this.read()
        }
      })
      .catch(async (error: unknown) => {
        if ((/no such key/ui).test(String(error))) {
          await this.createGroup()
          this.read()
          return
        }

        this.logger.error({ context: 'read' }, String(error))
      })
  }

  protected async readTaskRuns (): Promise<void> {
    const envelope = await this.queueRead?.xreadgroup(
      ['GROUP', [this.group, this.consumer]],
      ['COUNT', this.concurrency],
      ['BLOCK', this.block],
      'STREAMS',
      [this.name],
      this.xid
    ) as Array<[string, string[] | null]> | null

    const items = envelope?.[0][1] ?? []

    if (items.length === 0) {
      this.xid = '>'
      return
    }

    const connection = await this.database.connect()

    try {
      for (const [xid, [, value]] of items) {
        const taskRun = await connection.selectOne<TaskRun>(`
          SELECT
            code,
            fkey_item_id,
            fkey_queue_run_id,
            id,
            name,
            number,
            options,
            reason,
            result,
            xid
          FROM task_run
          WHERE id = $1
        `, [
          value
        ])

        if (taskRun === undefined) {
          continue
        }

        const item = await connection.selectOne<Item>(`
          SELECT
            code,
            fkey_queue_run_id,
            id,
            payload
          FROM item
          WHERE id = $1
        `, [
          taskRun.fkey_item_id
        ])

        if (item === undefined) {
          continue
        }

        const queueRun = await connection.selectOne<QueueRun>(`
          SELECT
            fkey_queue_id,
            id,
            name
          FROM queue_run
          WHERE id = $1
        `, [
          taskRun.fkey_queue_run_id
        ])

        if (queueRun === undefined) {
          continue
        }

        taskRun.item = item
        taskRun.queueRun = queueRun
        taskRun.xid = xid

        await connection.update(`
          UPDATE task_run
          SET
            date_queued = NOW(),
            date_updated = NOW(),
            xid = $1
          WHERE id = $2
        `, [
          taskRun.xid,
          taskRun.id
        ])

        this.queuer.push(taskRun)
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

      await connection.update(`
        UPDATE task_run
        SET
          code = $1,
          date_updated = NOW(),
          reason = $2,
          result = $3
        WHERE id = $4
      `, [
        taskRun.code,
        taskRun.reason,
        JSON.stringify(taskRun.result),
        taskRun.id
      ])

      await connection.update(`
        UPDATE item
        SET
          code = $1,
          date_updated = NOW()
        WHERE id = $2
      `, [
        taskRun.item.code,
        taskRun.item.id
      ])

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
          WHERE fkey_item_id = $1
          AND number > $2
          ORDER BY number ASC
          LIMIT 1
        `, [
          taskRun.item.id,
          taskRun.number
        ]) ?? null
      }

      if (nextTaskRun === null) {
        const field = taskRun.code === 'ok' ? 'ok' : 'err'

        await connection.update(`
          UPDATE queue_run
          SET
            aggr_${field} = aggr_${field} + 1,
            date_updated = NOW()
          WHERE id = $1
        `, [
          taskRun.queueRun.id
        ])

        const queues = await connection.select<Queue[]>(`
          SELECT queue.id
          FROM queue
          LEFT JOIN queue_run
          ON queue.fkey_queue_id = queue_run.fkey_queue_id
          WHERE queue_run.id = $1
          AND queue_run.aggr_ok + queue_run.aggr_err = queue_run.aggr_total
        `, [
          taskRun.queueRun.id
        ])

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
      connection.release()
    }
  }

  protected abstract run (taskRun: TaskRun): Promise<void>
}
