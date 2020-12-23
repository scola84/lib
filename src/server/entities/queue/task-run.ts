import type { Item } from './item'
import type { QueueRun } from './queue-run'

export interface TaskRun<Payload = unknown, Options = Record<string, unknown>> {
  code: string
  created?: Date
  id?: string
  item: Item<Payload>
  item_id?: string
  name: string
  options: Options
  order: number
  queueRun: QueueRun
  queue_run_id?: string
  reason?: string | null
  started?: Date | null
  updated?: Date
  xid?: string | null
}
