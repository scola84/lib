import type { Item, ItemPayload } from './item'
import type { QueueRun } from './queue-run'

export type TaskRunOptions = Record<string, unknown>
export type TaskRunResult = Record<string, unknown>

export interface TaskRun<
  Payload = ItemPayload,
  Options = TaskRunOptions,
  Result = TaskRunResult
> {
  date_created: Date
  date_queued: Date | null
  date_started: Date | null
  date_updated: Date
  fkey_item_id: number
  fkey_queue_run_id: number
  id: number
  code: 'err' | 'ok' | 'pending'
  consumer: string | null
  name: string
  number: number
  options: Options
  reason: string | null
  result: Result
  xid: string | null
  item: Item<Payload>
  queueRun: QueueRun
}

export function createTaskRun (
  payload: ItemPayload = {},
  options: TaskRunOptions = {},
  result: TaskRunResult = {}
): TaskRun {
  return {
    code: 'pending',
    consumer: null,
    date_created: new Date(),
    date_queued: null,
    date_started: null,
    date_updated: new Date(),
    fkey_item_id: 0,
    fkey_queue_run_id: 0,
    id: 0,
    item: {
      code: 'pending',
      date_created: new Date(),
      date_updated: new Date(),
      fkey_queue_run_id: 0,
      id: 0,
      payload
    },
    name: 'name',
    number: 0,
    options,
    queueRun: {
      aggr_err: 0,
      aggr_ok: 0,
      aggr_total: 0,
      code: 'pending',
      date_created: new Date(),
      date_updated: new Date(),
      fkey_queue_id: 0,
      id: 0,
      name: 'name',
      queue: {
        connection: 'connection',
        date_created: new Date(),
        date_updated: new Date(),
        fkey_queue_id: 0,
        id: 0,
        name: 'name',
        query: '',
        schedule: '',
        schedule_begin: null,
        schedule_end: null,
        schedule_next: null,
        tasks: []
      },
      reason: null
    },
    reason: null,
    result,
    xid: 'xid'
  }
}
