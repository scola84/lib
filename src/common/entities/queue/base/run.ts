export interface Run {
  aggr_err: number
  aggr_ok: number
  aggr_total: number
  date_created: Date
  date_updated: Date
  name: string | null
  options: unknown | null
  queue_id: number
  reason: string | null
  run_id: number
  status: string
  task_id: number | null
}
