import type { QueueRun } from './queue-run'
import type { TaskRun } from './task-run'

export interface Item<Payload = unknown> {
  code?: string
  created?: Date
  id?: string
  payload: Payload
  queueRun: QueueRun
  queue_run_id?: string
  taskRuns?: TaskRun[]
  updated?: Date
}
