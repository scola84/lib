export interface Task {
  date_created?: Date
  date_updated?: Date
  fkey_queue_id: number
  id?: number
  name?: string
  number?: number
  options?: unknown
}
