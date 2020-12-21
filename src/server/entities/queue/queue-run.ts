import type { Item } from './item'
import type { Queue } from './queue'
import type { TaskRun } from './task-run'

export interface QueueRun {
  created?: Date
  err?: number
  id?: string
  items?: Item[]
  name: string
  ok?: number
  queue: Queue
  queue_id?: string
  taskRuns?: TaskRun[]
  total: number
  updated?: Date
}
