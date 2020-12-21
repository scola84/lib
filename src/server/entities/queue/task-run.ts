import type { Item } from './item'
import type { QueueRun } from './queue-run'

export type TaskRunOptions = Record<string, unknown>

export interface TaskRun<Payload = unknown> {
  code: string
  created?: Date
  id?: string
  item: Item<Payload>
  item_id?: string
  name: string
  options: TaskRunOptions | null
  order: number
  queueRun: QueueRun
  queue_run_id?: string
  reason?: string | null
  started?: Date | null
  updated?: Date
  xid?: string | null
}
