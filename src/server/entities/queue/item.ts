export type ItemPayload = Record<string, unknown>

export interface Item<Payload = ItemPayload> {
  date_created?: Date
  date_updated?: Date
  fkey_queue_run_id: string
  id: string
  code: string
  payload: Payload
}
