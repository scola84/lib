import type { Queue } from './queue'
import type { QueueRun } from './queue-run'
import type { QueueTask } from './queue-task'

export * from './queue'
export * from './queue-run'
export * from './queue-task'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  queue: Array<Partial<Queue>>
  queue_run: Array<Partial<QueueRun>>
  queue_task: Array<Partial<QueueTask>>
}
