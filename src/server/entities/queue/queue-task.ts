import type { QueueRun } from './queue-run'
import type { QueueTask as QueueTaskBase } from './base/queue-task'
import { Struct } from '../../../common'
import { createQueueRun } from './queue-run'

export interface QueueTask<Payload = unknown, Options = unknown, Result = unknown> extends Required<QueueTaskBase> {
  /**
   * The date the task was created.
   */
  date_created: Date

  /**
   * The date the task was queued.
   */
  date_queued: Date | null

  /**
   * The date the task was started.
   */
  date_started: Date | null

  /**
   * The date the task was updated.
   */
  date_updated: Date

  /**
   * The ID of the queue run.
   */
  fkey_queue_run_id: number

  /**
   * The host.
   */
  host: string | null

  /**
   * The ID.
   */
  id: number

  /**
   * The payload.
   */
  payload: Payload

  /**
   * The queue run.
   *
   * @see {@link QueueRun}
   */
  run: QueueRun<Options>

  /**
   * The reason the task failed.
   */
  reason: string | null

  /**
   * The result.
   */
  result: Result

  /**
   * The status.
   */
  status: 'err' | 'ok' | 'pending'
}

export function createQueueTask<Payload = Struct, Options = Struct, Result = Struct> (task?: Partial<QueueTask<Payload, Options, Result>>, date = new Date()): QueueTask<Payload, Options, Result> {
  return {
    date_created: date,
    date_queued: null,
    date_started: null,
    date_updated: date,
    fkey_queue_run_id: 0,
    host: null,
    id: 0,
    payload: Struct.create(),
    reason: null,
    result: Struct.create(),
    run: task?.run ?? createQueueRun<Options>(),
    status: 'pending',
    ...task
  }
}
