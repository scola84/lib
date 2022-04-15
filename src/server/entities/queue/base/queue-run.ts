export interface QueueRun {
  aggr_err: number
  aggr_ok: number
  aggr_total: number
  date_created: Date
  date_updated: Date
  fkey_queue_id: number
  fkey_queue_task_id: number | null
  id: number
  name: string
  options: unknown
  reason: string | null
  status: string
}
