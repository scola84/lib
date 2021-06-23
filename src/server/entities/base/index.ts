import type { Queue } from './queue'
import type { QueueRun } from './queue-run'
import type { TaskRun } from './task-run'

export * from './queue'
export * from './queue-run'
export * from './task-run'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  queue: Array<Partial<Queue>>
  queue_run: Array<Partial<QueueRun>>
  task_run: Array<Partial<TaskRun>>
}
