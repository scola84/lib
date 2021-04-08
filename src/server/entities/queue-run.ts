import type { Queue } from './queue'
import type { QueueRun as QueueRunBase } from './base'
import { createQueue } from './queue'

export interface QueueRun extends Required<QueueRunBase> {
  code: 'err' | 'ok' | 'pending'
  queue: Queue
}

export function createQueueRun (): QueueRun {
  return {
    aggr_err: 0,
    aggr_ok: 0,
    aggr_total: 0,
    code: 'pending',
    date_created: new Date(),
    date_updated: new Date(),
    fkey_item_id: null,
    fkey_queue_id: 0,
    id: 0,
    name: 'name',
    queue: createQueue(),
    reason: null
  }
}
