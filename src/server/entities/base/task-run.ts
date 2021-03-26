export interface TaskRun {
  date_created?: Date
  date_queued: Date | null
  date_started: Date | null
  date_updated?: Date
  fkey_item_id: number
  fkey_queue_run_id: number
  fkey_task_id: number
  id?: number
  code?: string
  consumer: string | null
  reason: string | null
  result?: unknown
  xid: string | null
}
