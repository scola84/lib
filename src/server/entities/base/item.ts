export interface Item {
  code?: string
  date_created?: Date
  date_updated?: Date
  fkey_queue_run_id: number
  id?: number
  payload: unknown
}
