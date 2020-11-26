import {
  LessThan,
  Like,
  MoreThan,
  getManager
} from 'typeorm'

import type { EntityManager } from 'typeorm'
import type { FastifyLoggerInstance } from 'fastify'
import { Queue } from '../../entities'
import { QueueRunner } from '../../helpers'
import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'
import { parseExpression } from 'cron-parser'
import { scheduleJob } from 'node-schedule'

export interface QueueManagerOptions {
  entityManager: string
  filter: string
  listenerClient: RedisOptions
  logger: FastifyLoggerInstance
  schedule: string
}

export interface QueueMessage {
  id: number
  name: string
  payload: unknown
}

export class QueueManager {
  public entityManager: EntityManager

  public filter?: string

  public listenerClient?: Redis.Redis

  public logger?: FastifyLoggerInstance

  public options: Partial<QueueManagerOptions>

  public schedule?: string

  public constructor (options: Partial<QueueManagerOptions> = {}) {
    this.options = options
  }

  public callListener (message: string): void {
    try {
      const {
        id,
        name,
        payload
      } = JSON.parse(message) as QueueMessage

      this.entityManager
        .find(Queue, {
          relations: ['tasks'],
          where: {
            id,
            name
          }
        })
        .then((queues) => {
          queues.forEach((queue) => {
            this.run(queue, payload, false)
          })
        })
        .catch((error: Error) => {
          this.logger?.error({ context: 'listener-find' }, String(error))
        })
    } catch (error: unknown) {
      this.logger?.error({ context: 'listener-parse' }, String(error))
    }
  }

  public callSchedule (date = new Date()): void {
    this.entityManager
      .find(Queue, {
        relations: ['tasks'],
        where: {
          name: Like(`%${this.filter ?? ''}%`),
          scheduleBegin: LessThan(date),
          scheduleEnd: MoreThan(date),
          scheduleNext: LessThan(date)
        }
      })
      .then((queues) => {
        queues.forEach((queue) => {
          this.run(queue)
        })
      })
      .catch((error: Error) => {
        this.logger?.error({ context: 'schedule' }, String(error))
      })
  }

  public start (): void {
    const {
      entityManager,
      filter,
      listenerClient,
      logger,
      schedule
    } = this.options

    if (listenerClient !== undefined) {
      this.listenerClient = new Redis(listenerClient)
    }

    if (entityManager !== undefined) {
      this.entityManager = getManager(entityManager)
    }

    this.filter = filter
    this.schedule = schedule

    this.logger = logger?.child({
      source: 'queue-manager'
    })

    if (this.schedule !== undefined) {
      this.startSchedule(this.schedule)
    }

    if (this.listenerClient !== undefined) {
      this.startListener(this.listenerClient)
    }
  }

  protected run (queue: Queue, payload?: unknown, scheduleNext = true): void {
    const runner = new QueueRunner()
    runner.start()

    runner
      .run(queue, payload)
      .catch((error: Error) => {
        this.logger?.error({ context: 'run' }, String(error))
      })

    if (queue.schedule !== null && scheduleNext) {
      this.entityManager
        .createQueryBuilder()
        .update(Queue)
        .set({
          scheduleNext: parseExpression(queue.schedule).next()
        })
        .where({
          id: queue.id
        })
        .execute()
        .catch((error: Error) => {
          this.logger?.error({ context: 'cron' }, String(error))
        })
    }
  }

  protected startListener (client: Redis.Redis): void {
    client
      .subscribe('queue')
      .then(() => {
        client.on('message', (channel, message) => {
          this.callListener(message)
        })
      })
      .catch((error: Error) => {
        this.logger?.error({ context: 'listener-message' }, String(error))
      })
  }

  protected startSchedule (schedule: string): void {
    scheduleJob(schedule, (date) => {
      this.callSchedule(date)
    })
  }
}
