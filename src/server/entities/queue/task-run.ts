import type { Item, ItemPayload } from './item'
import type { QueueRun } from './queue-run'

export type TaskRunOptions = Record<string, unknown>
export type TaskRunResult = Record<string, unknown>

export interface TaskRun<
  Payload = ItemPayload,
  Options = TaskRunOptions,
  Result = TaskRunResult
> {
  date_created?: Date
  date_started?: Date | null
  date_updated?: Date
  fkey_item_id: string
  fkey_queue_run_id: string
  id: string
  code: string
  name: string
  options: Options
  order: number
  reason: string | null
  result: Result
  xid: string | null
  item: Item<Payload>
  queueRun: QueueRun
}
