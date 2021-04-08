export interface TaskRun {
  code?: string
  consumer: string | null
  date_created?: Date
  date_queued: Date | null
  date_started: Date | null
  date_updated?: Date
  fkey_item_id: number
  fkey_queue_run_id: number
  fkey_task_id: number
  id?: number
  reason: string | null
  result?: unknown
  xid: string | null
}
