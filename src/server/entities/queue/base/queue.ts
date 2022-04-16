export interface Queue {
  date_created: Date
  date_updated: Date
  db_name: string | null
  db_query: string | null
  name: string
  options: unknown
  parent_id: number | null
  queue_id: number
  schedule_begin: Date | null
  schedule_cron: string | null
  schedule_end: Date | null
  schedule_next: Date | null
}
