import {
  Item,
  Queue,
  QueueRun,
  TaskRun
} from '../../entities'

import type {
  Task,
  TaskRunOptions
} from '../../entities'

import {
  getConnection,
  getManager
} from 'typeorm'

import type { EntityManager } from 'typeorm'
import type { FastifyLoggerInstance } from 'fastify'
import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'
import { Writable } from 'stream'

export interface QueueRunnerOptions {
  entityManager: string
  logger: FastifyLoggerInstance
  maxLength: number
  queueClient: RedisOptions
}

export class QueueRunner extends Writable {
  public static options?: Partial<QueueRunnerOptions>

  public entityManager?: EntityManager

  public logger?: FastifyLoggerInstance

  public maxLength: string[]

  public options: Partial<QueueRunnerOptions>

  public queueClient: Redis.Redis

  public queueRun: QueueRun

  public constructor (options?: Partial<QueueRunnerOptions>) {
    super({
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
      this.logger?.error({ context: '_final' }, String(error))
    }

    callback()
  }

  public async _write (payload: unknown, encoding: string, callback: () => void): Promise<void> {
    try {
      const item = new Item()
      item.payload = payload
      item.queueRun = this.queueRun

      if (Array.isArray(item.queueRun.taskRuns)) {
        await this.writeItem(item)
      } else {
        await this.writePayload(payload)
      }

      this.queueRun.total += 1
    } catch (error: unknown) {
      this.logger?.error({ context: '_write' }, String(error))
    }

    callback()
  }

  public async run (queue: Queue, payload?: unknown): Promise<void> {
    this.queueRun = new QueueRun()
    this.queueRun.name = queue.name
    this.queueRun.queue = queue

    if (Array.isArray(queue.tasks) && queue.tasks.length > 0) {
      this.queueRun.taskRuns = queue.tasks.map((task) => {
        return {
          name: task.name,
          options: this.createOptions(task),
          order: task.order,
          queueRun: this.queueRun
        }
      })
    }

    await this.entityManager?.save(this.queueRun)

    if (queue.query === null || queue.connection === null) {
      this.write(payload)
      return
    }

    const parameters = Array.isArray(payload)
      ? payload
      : []

    const queryRunner = getConnection(queue.connection).createQueryRunner()
    const stream = await queryRunner.stream(queue.query, parameters)

    stream
      .once('error', (error) => {
        queryRunner.release().catch(() => {})
        this.logger?.error({ context: 'run' }, String(error))
      })
      .once('end', () => {
        queryRunner.release().catch(() => {})
        stream.unpipe(this)
      })
      .pipe(this)
  }

  public start (): void {
    const {
      entityManager,
      logger,
      maxLength,
      queueClient
    } = this.options

    if (queueClient === undefined) {
      throw new Error('Queue client is undefined')
    }

    if (entityManager !== undefined) {
      this.entityManager = getManager(entityManager)
    }

    this.maxLength = maxLength === undefined
      ? []
      : ['MAXLEN', '~', String(maxLength)]
    this.queueClient = new Redis(queueClient)

    this.logger = logger?.child({
      source: 'queue-runner'
    })
  }

  protected createOptions (task: Task): TaskRunOptions {
    return task.options?.reduce((options, { name, value }) => {
      return Object.assign(options, {
        [name]: value
      })
    }, {}) ?? {}
  }

  protected async runNextQueues (queueRun: QueueRun): Promise<void> {
    const nextQueues = await this.entityManager
      ?.createQueryBuilder()
      .select('queue')
      .from(Queue, 'queue')
      .innerJoin('queue_run', 'queueRun', 'queueRun.queueId = queue.previousQueueId')
      .where('queueRun.id = :id', queueRun)
      .andWhere('queueRun.ok + queueRun.err = queueRun.total')
      .getMany() ?? []

    for (const { name } of nextQueues) {
      await this.queueClient.publish('queue', JSON.stringify({
        name,
        payload: [queueRun.id]
      }))
    }
  }

  protected async updateQueueRunTotal (queueRun: QueueRun): Promise<void> {
    await this.entityManager
      ?.createQueryBuilder()
      .update(QueueRun)
      .set({
        total: queueRun.total
      })
      .where({
        id: queueRun.id
      })
      .execute()
  }

  protected async writeItem (item: Item): Promise<void> {
    item.taskRuns = this.queueRun.taskRuns?.map((taskRun) => {
      return Object.assign(new TaskRun(), taskRun)
    })

    const [nextTaskRun] = item.taskRuns ?? []
    const name = `${this.queueRun.name}-${nextTaskRun.name}`

    await this.entityManager?.save(item)
    await this.queueClient.xadd(name, ...this.maxLength, '*', [
      'taskRunId',
      nextTaskRun.id
    ])

    this.logger?.debug({ name }, 'Enqueue task %o', item.payload)
  }

  protected async writePayload (payload: unknown): Promise<void> {
    await this.queueClient.xadd(
      this.queueRun.name,
      ...this.maxLength,
      '*',
      [
        'payload',
        JSON.stringify(payload)
      ]
    )

    this.logger?.debug({ name: this.queueRun.name }, 'Enqueue task %o', payload)
  }
}
