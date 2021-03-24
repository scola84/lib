export interface TaskRun {
  date_created?: Date
  date_queued: Date | null
  date_started: Date | null
  date_updated?: Date
  fkey_item_id: number
  fkey_queue_run_id: number
  id?: number
  code?: string
  consumer: string | null
  name: string
  options: unknown
  number: number
  reason: string | null
  result?: unknown
  xid: string | null
}
