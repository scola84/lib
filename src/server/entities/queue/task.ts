import type { Run } from './run'
import { Struct } from '../../../common'
import type { Task as TaskBase } from './base/task'
import { createRun } from './run'

export interface Task<Payload = unknown, Options = unknown, Result = unknown> extends Required<TaskBase> {
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
   * The host.
   */
  host: string | null

  /**
   * The payload.
   */
  payload: Payload

  /**
   * The queue run.
   *
   * @see {@link QueueRun}
   */
  run: Run<Options>

  /**
   * The reason the task failed.
   */
  reason: string | null

  /**
   * The result.
   */
  result: Result

  /**
   * The ID of the queue run.
   */
  run_id: number

  /**
   * The status.
   */
  status: 'err' | 'ok' | 'pending'

  /**
   * The ID.
   */
  task_id: number
}

export function createTask<Payload = Struct, Options = Struct, Result = Struct> (task?: Partial<Task<Payload, Options, Result>>, date = new Date()): Task<Payload, Options, Result> {
  return {
    date_created: task?.date_created ?? date,
    date_queued: task?.date_queued ?? null,
    date_started: task?.date_started ?? null,
    date_updated: task?.date_updated ?? date,
    host: task?.host ?? null,
    payload: task?.payload ?? Struct.create(),
    reason: task?.reason ?? null,
    result: task?.result ?? Struct.create(),
    run: task?.run ?? createRun<Options>(),
    run_id: task?.run_id ?? 0,
    status: task?.status ?? 'pending',
    task_id: task?.task_id ?? 0
  }
}
