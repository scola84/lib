export type TaskOptions = Record<string, unknown>

export interface Task<Options = TaskOptions> {
  date_created?: Date
  date_updated?: Date
  fkey_queue_id: string
  id: string
  name: string
  options: Options
  order: number
}
