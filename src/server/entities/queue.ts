import type { Queue as QueueBase } from './base'

export interface Queue<Options = unknown> extends Required<QueueBase> {
  /**
   * The database to run the generator query on.
   */
  database: string | null

  /**
   * The date the queue was created.
   */
  date_created: Date

  /**
   * The date the queue was updated.
   */
  date_updated: Date

  /**
   * The ID of the queue.
   *
   * If a queue run has finished, dependant queues will be triggered.
   */
  fkey_queue_id: number | null

  /**
   * The ID.
   */
  id: number

  /**
   * The name.
   */
  name: string

  /**
   * The options.
   */
  options: Options

  /**
   * The generator query.
   */
  query: string | null

  /**
   * The schedule as a cron schedule expression.
   *
   * @see https://www.npmjs.com/package/node-schedule
   */
  schedule: string | null

  /**
   * The date after which the queue may be run.
   */
  schedule_begin: Date | null

  /**
   * The date before which the queue may be run.
   */
  schedule_end: Date | null

  /**
   * The date of the next queue run.
   */
  schedule_next: Date | null
}

export function createQueue<Options = Record<string, unknown>> (queue?: Partial<Queue<Options>>): Queue<Options> {
  return {
    database: 'database',
    date_created: new Date(),
    date_updated: new Date(),
    fkey_queue_id: 0,
    id: 0,
    name: 'name',
    options: (queue?.options ?? {}) as Options,
    query: '',
    schedule: '',
    schedule_begin: null,
    schedule_end: null,
    schedule_next: null
  }
}
