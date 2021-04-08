export interface QueueRun {
  aggr_err?: number
  aggr_ok?: number
  aggr_total?: number
  code?: string
  date_created?: Date
  date_updated?: Date
  fkey_item_id: number | null
  fkey_queue_id: number
  id?: number
  name: string
  reason: string | null
}
