import type { Queue as QueueBase } from './base/queue'
import type { Struct } from '../../../common'

export interface Queue<Options = unknown> extends Required<QueueBase> {
  /**
   * The date the queue was created.
   */
  date_created: Date

  /**
   * The date the queue was updated.
   */
  date_updated: Date

  /**
   * The database to run the generator query on.
   */
  db_name: string | null

  /**
   * The generator query.
   */
  db_query: string | null

  /**
   * The ID of the parent queue.
   *
   * If a queue run has finished, dependant queues will be triggered.
   */
  parent_id: number | null

  /**
   * The ID.
   */
  queue_id: number

  /**
   * The name.
   */
  name: string

  /**
   * The options.
   */
  options: Options

  /**
   * The schedule as a cron schedule expression.
   *
   * @see https://www.npmjs.com/package/node-schedule
   */
  schedule_cron: string | null

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

export function createQueue<Options = Struct> (queue?: Partial<Queue<Options>>, date = new Date()): Queue<Options> {
  return {
    date_created: queue?.date_created ?? date,
    date_updated: queue?.date_updated ?? date,
    db_name: queue?.db_name ?? 'database',
    db_query: queue?.db_query ?? 'SELECT 1',
    name: queue?.name ?? 'name',
    options: queue?.options ?? ({} as unknown as Options),
    parent_id: queue?.parent_id ?? 0,
    queue_id: queue?.queue_id ?? 0,
    schedule_begin: queue?.schedule_begin ?? null,
    schedule_cron: queue?.schedule_cron ?? '* * * * *',
    schedule_end: queue?.schedule_end ?? null,
    schedule_next: queue?.schedule_next ?? null
  }
}
