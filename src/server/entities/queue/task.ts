import type { Queue } from './queue'

export type TaskOptions = Record<string, unknown>

export interface Task {
  created?: Date
  id?: string
  name: string
  options: TaskOptions
  order: number
  queue: Queue
  queue_id?: string
  updated?: Date
}
