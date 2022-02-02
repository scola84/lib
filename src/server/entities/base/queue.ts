export interface Queue {
  database: string | null
  date_created: Date
  date_updated: Date
  fkey_queue_id: number | null
  id: number
  name: string
  options: unknown
  query: string | null
  schedule: string | null
  schedule_begin: Date | null
  schedule_end: Date | null
  schedule_next: Date | null
}
