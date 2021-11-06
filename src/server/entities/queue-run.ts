import type { Queue } from './queue'
import type { QueueRun as QueueRunBase } from './base'
import { createQueue } from './queue'

export interface QueueRun<Options = unknown> extends Required<QueueRunBase> {
  /**
   * The number of task runs which have failed.
   */
  aggr_err: number

  /**
   * The number of task runs which have finished.
   */
  aggr_ok: number

  /**
   * The total number of task runs.
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
   * The ID of the parent queue.
   */
  fkey_queue_id: number

  /**
   * THe ID of the last task run.
   */
  fkey_task_run_id: number | null

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
   * The parent queue as Queue.
   *
   * @see {@link Queue}
   */
  queue: Queue<Options>

  /**
   * The reason the queue run failed.
   */
  reason: string | null

  /**
   * The status.
   */
  status: 'err' | 'ok' | 'pending'
}

export function createQueueRun<Options = Record<string, unknown>> (queueRun?: Partial<QueueRun<Options>>): QueueRun<Options> {
  return {
    aggr_err: 0,
    aggr_ok: 0,
    aggr_total: 0,
    date_created: new Date(),
    date_updated: new Date(),
    fkey_queue_id: queueRun?.queue?.id ?? 0,
    fkey_task_run_id: null,
    id: 0,
    name: queueRun?.queue?.name ?? 'name',
    options: (queueRun?.queue?.options ?? {}) as Options,
    queue: queueRun?.queue ?? createQueue<Options>(),
    reason: null,
    status: 'pending',
    ...queueRun
  }
}
