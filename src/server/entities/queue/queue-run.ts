import type { Queue } from './queue'

export interface QueueRun {
  aggr_err: number
  aggr_ok: number
  aggr_total: number
  date_created?: Date
  date_updated?: Date
  fkey_queue_id: string
  id: string
  name: string
  queue: Queue
}
