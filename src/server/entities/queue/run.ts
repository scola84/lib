import type { Queue } from './queue'
import type { Run as RunBase } from './base/run'
import type { Struct } from '../../../common'
import { createQueue } from './queue'

export interface Run<Options = unknown> extends Required<RunBase> {
  /**
   * The number of tasks which have failed.
   */
  aggr_err: number

  /**
   * The number of tasks which have finished.
   */
  aggr_ok: number

  /**
   * The total number of tasks.
   */
  aggr_total: number

  /**
   * The date the queue run was created.
   */
  date_created: Date

  /**
   * The date the queue run was updated.
   */
  date_updated: Date

  /**
   * The ID.
   */
  run_id: number

  /**
   * The name.
   */
  name: string

  /**
   * The options.
   */
  options: Options

  /**
   * The queue.
   *
   * @see {@link Queue}
   */
  queue: Queue<Options>

  /**
   * The ID of the queue.
   */
  queue_id: number

  /**
   * The reason the queue run failed.
   */
  reason: string | null

  /**
   * The status.
   */
  status: 'err' | 'ok' | 'pending'

  /**
   * THe ID of the last task.
   */
  task_id: number | null
}

export function createRun<Options = Struct> (run?: Partial<Run<Options>>, date = new Date()): Run<Options> {
  return {
    aggr_err: 0,
    aggr_ok: 0,
    aggr_total: 0,
    date_created: date,
    date_updated: date,
    name: run?.queue?.name ?? 'name',
    options: (run?.queue?.options ?? {}) as Options,
    queue: run?.queue ?? createQueue<Options>(),
    queue_id: run?.queue?.queue_id ?? 0,
    reason: null,
    run_id: 0,
    status: 'pending',
    task_id: null,
    ...run
  }
}
