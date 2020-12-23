import type { Queue } from './queue'

export interface Task<Options = Record<string, unknown>> {
  created?: Date
  id?: string
  name: string
  options: Options
  order: number
  queue: Queue
  queue_id?: string
  updated?: Date
}
