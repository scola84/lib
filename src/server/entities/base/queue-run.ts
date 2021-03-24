export interface QueueRun {
  aggr_err?: number
  aggr_ok?: number
  aggr_total?: number
  date_created?: Date
  date_updated?: Date
  fkey_queue_id: number
  id?: number
  code?: string
  name: string
  reason: string | null
}
