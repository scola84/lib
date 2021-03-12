import type { Queue } from './queue'

export interface QueueRun {
  aggr_err: number
  aggr_ok: number
  aggr_total: number
  date_created: Date
  date_updated: Date
  fkey_queue_id: number | string
  id: number | string
  code: 'err' | 'ok' | 'pending'
  name: string
  reason: string | null
  queue: Queue
}
