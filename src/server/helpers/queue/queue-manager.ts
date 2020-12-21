import type { IDatabase, ITask } from 'pg-promise'
import type { Queue, Task } from '../../entities'
import type { ClientOpts } from 'redis'
import type { FastifyLoggerInstance } from 'fastify'
import { QueueRunner } from '../../helpers/queue/queue-runner'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { createNodeRedisClient } from 'handy-redis'
import { parseExpression } from 'cron-parser'
import { scheduleJob } from 'node-schedule'

export interface QueueManagerOptions {
  filter: string
  listenerClient: ClientOpts
  logger: FastifyLoggerInstance
  database: IDatabase<unknown>
  schedule: string
}

export interface QueueMessage {
  id?: number
  name?: string
  payload?: unknown
}

export class QueueManager {
  public database?: IDatabase<unknown>

  public filter?: string

  public listenerClient?: WrappedNodeRedisClient

  public logger?: FastifyLoggerInstance

  public options: Partial<QueueManagerOptions>

  public schedule?: string

  public constructor (options: Partial<QueueManagerOptions> = {}) {
    this.options = options
  }

  public async callListener (message: string): Promise<void> {
    try {
      const {
        id,
        name,
        payload
      } = JSON.parse(message) as QueueMessage

      let queues: Queue[] = []

      if (id !== undefined) {
        queues = await this.selectQueuesById(id)
      } else if (name !== undefined) {
        queues = await this.selectQueuesByName(name)
      }

      for (const queue of queues) {
        this.run(queue, payload, false)
      }
    } catch (error: unknown) {
      this.logger?.error({ context: 'call-listener' }, String(error))
    }
  }

  public async callSchedule (date = new Date()): Promise<void> {
    try {
      for (const queue of await this.selectQueuesBySchedule(date)) {
        this.run(queue)
      }
    } catch (error: unknown) {
      this.logger?.error({ context: 'call-schedule' }, String(error))
    }
  }

  public start (call = false): void {
    const {
      database,
      filter,
      listenerClient,
      logger,
      schedule
    } = this.options

    if (listenerClient !== undefined) {
      this.listenerClient = createNodeRedisClient(listenerClient)
    }

    if (database !== undefined) {
      this.database = database
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

    if (call) {
      this
        .callSchedule()
        .catch(() => {})
    }
  }

  protected run (queue: Queue, payload?: unknown, scheduleNext = true): void {
    const runner = new QueueRunner()
    runner.start()

    runner
      .run(queue, payload)
      .catch((error: unknown) => {
        this.logger?.error({ context: 'run' }, String(error))
      })

    if (typeof queue.schedule === 'string' && scheduleNext) {
      this.database
        ?.query(`
          UPDATE queue
          SET 
            schedule_next = $(next),
            updated = NOW()
          WHERE id = $(queue_id)
        `, {
          next: parseExpression(queue.schedule).next(),
          queue_id: queue.id
        })
        .catch((error: unknown) => {
          this.logger?.error({ context: 'run-update-queue' }, String(error))
        })
    }
  }

  protected async selectQueuesById (id: number): Promise<Queue[]> {
    return await this.database?.task<Queue[]>(async (task) => {
      return await task
        .map<Promise<Queue>>(`
          SELECT *
          FROM queue
          WHERE id = $(queue_id)
        `, {
          queue_id: id
        }, async (queue: Queue) => {
          await this.selectTasks(task, queue)
          return queue
        })
        .then(async (data) => {
          return await task
            .batch(data)
            .catch((error: unknown) => {
              this.logger?.error({ context: 'select-queues-by-id-batch' }, String(error))
              return []
            })
        })
        .catch((error: unknown) => {
          this.logger?.error({ context: 'select-queues-by-id-map' }, String(error))
          return []
        })
    }).catch((error: unknown) => {
      this.logger?.error({ context: 'select-queues-id-task' }, String(error))
      return []
    }) ?? []
  }

  protected async selectQueuesByName (name: string): Promise<Queue[]> {
    return await this.database?.task<Queue[]>(async (task) => {
      return await task
        .map<Promise<Queue>>(`
          SELECT *
          FROM queue
          WHERE name = $(name)
        `, {
          name
        }, async (queue: Queue) => {
          await this.selectTasks(task, queue)
          return queue
        })
        .then(async (queries) => {
          return await task
            .batch(queries)
            .catch((error: unknown) => {
              this.logger?.error({ context: 'select-queues-by-name-batch' }, String(error))
              return []
            })
        })
        .catch((error: unknown) => {
          this.logger?.error({ context: 'select-queues-by-name-map' }, String(error))
          return []
        })
    }).catch((error: unknown) => {
      this.logger?.error({ context: 'select-queues-by-name-task' }, String(error))
      return []
    }) ?? []
  }

  protected async selectQueuesBySchedule (date: Date): Promise<Queue[]> {
    return await this.database?.task<Queue[]>(async (task) => {
      return await task
        .map<Promise<Queue>>(`
          SELECT *
          FROM queue
          WHERE name LIKE $(name)
          AND schedule_begin <= $(date)
          AND schedule_end >= $(date)
          AND schedule_next <= $(date)
        `, {
          date,
          name: `%${this.filter ?? ''}%`
        }, async (queue: Queue) => {
          await this.selectTasks(task, queue)
          return queue
        })
        .then(async (data) => {
          return await task
            .batch(data)
            .catch((error: unknown) => {
              this.logger?.error({ context: 'select-queues-by-schedule-batch' }, String(error))
              return []
            })
        })
        .catch((error: unknown) => {
          this.logger?.error({ context: 'select-queues-by-schedule-map' }, String(error))
          return []
        })
    }).catch((error: unknown) => {
      this.logger?.error({ context: 'select-queues-by-schedule-task' }, String(error))
      return []
    }) ?? []
  }

  protected async selectTasks (task: ITask<unknown>, queue: Queue): Promise<void> {
    await task
      .any<Task>(`
        SELECT
          *,
          (
            SELECT COALESCE(JSON_OBJECT_AGG(task_option.name, task_option.value), '{}'::JSON)
            FROM task_option 
            WHERE task_option.id = task.id
          ) AS options
        FROM task
        WHERE queue_id = $(queue_id)
      `, {
        queue_id: queue.id
      })
      .then((tasks) => {
        queue.tasks = tasks
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'select-tasks' }, String(error))
      })
  }

  protected startListener (client: WrappedNodeRedisClient): void {
    client
      .subscribe('queue')
      .then(() => {
        client.nodeRedis.on('message', (channel, message) => {
          this
            .callListener(message)
            .catch(() => {})
        })
      })
      .catch((error: unknown) => {
        this.logger?.error({ context: 'start-listener' }, String(error))
      })
  }

  protected startSchedule (schedule: string): void {
    scheduleJob(schedule, (date) => {
      this
        .callSchedule(date)
        .catch((error: unknown) => {
          this.logger?.error({ context: 'start-schedule' }, String(error))
        })
    })
  }
}
