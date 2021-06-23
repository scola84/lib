export interface TaskRun {
  date_created?: Date
  date_queued: Date | null
  date_started: Date | null
  date_updated?: Date
  fkey_queue_run_id: number
  host: string | null
  id?: number
  payload: unknown
  reason: string | null
  result?: unknown
  status?: string
}
