export interface Task {
  date_created: Date
  date_queued: Date | null
  date_started: Date | null
  date_updated: Date
  host: string | null
  payload: unknown
  reason: string | null
  result: unknown
  run_id: number
  status: string
  task_id: number
}
