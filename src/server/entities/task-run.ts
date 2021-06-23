import type { QueueRun } from './queue-run'
import type { TaskRun as TaskRunBase } from './base'
import { createQueueRun } from './queue-run'

export interface TaskRun<Payload = unknown, Options = unknown, Result = unknown> extends Required<TaskRunBase> {
  /**
   * The date the task run was created.
   */
  date_created: Date

  /**
   * The date the task run was queued.
   */
  date_queued: Date | null

  /**
   * The date the task run was started.
   */
  date_started: Date | null

  /**
   * The date the task run was updated.
   */
  date_updated: Date

  /**
   * The ID of the parent queue run.
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
   * The parent queue run as QueueRun.
   */
  queueRun: QueueRun<Options>

  /**
   * The reason the task run failed.
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

export function createTaskRun<Payload, Options, Result> (payload?: Payload): TaskRun<Payload, Options, Result> {
  return {
    date_created: new Date(),
    date_queued: null,
    date_started: null,
    date_updated: new Date(),
    fkey_queue_run_id: 0,
    host: null,
    id: 0,
    payload: (payload ?? {}) as Payload,
    queueRun: createQueueRun(),
    reason: null,
    result: Object.create(null) as Result,
    status: 'pending'
  }
}
