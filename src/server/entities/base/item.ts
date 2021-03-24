export interface Item {
  date_created?: Date
  date_updated?: Date
  fkey_queue_run_id: number
  id?: number
  code?: string
  payload: unknown
}
