import type { Task } from './task'

export interface Queue {
  date_created: Date
  date_updated: Date
  fkey_queue_id: number | string | null
  id: number | string
  connection: string | null
  name: string
  query: string | null
  schedule: string | null
  schedule_begin: Date | null
  schedule_end: Date | null
  schedule_next: Date | null
  tasks: Task[]
}
