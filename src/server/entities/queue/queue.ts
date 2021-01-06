import type { Task } from './task'

export interface Queue {
  date_created?: Date
  date_updated?: Date
  fkey_queue_id: null | string
  id: string
  connection: null | string
  name: string
  query: null | string
  schedule: null | string
  schedule_begin: Date | null
  schedule_end: Date | null
  schedule_next: Date | null
  tasks: Task[]
}
