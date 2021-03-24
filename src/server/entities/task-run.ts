import type { Item } from './item'
import type { QueueRun } from './queue-run'
import type { TaskRun as TaskRunBase } from './base'
import { createItem } from './item'
import { createQueueRun } from './queue-run'

export interface TaskRun<Payload = unknown, Options = unknown, Result = unknown> extends Required<TaskRunBase> {
  code: 'err' | 'ok' | 'pending'
  options: Options
  result: Result
  item: Item<Payload>
  queueRun: QueueRun
}

export function createTaskRun<Payload, Options, Result> (payload: Payload, options: Options, result: Result): TaskRun<Payload, Options, Result> {
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
    item: createItem(payload),
    name: 'name',
    number: 0,
    options,
    queueRun: createQueueRun(),
    reason: null,
    result,
    xid: 'xid'
  }
}
