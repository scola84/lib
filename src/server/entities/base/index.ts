import type { Item } from './item'
import type { Queue } from './queue'
import type { QueueRun } from './queue-run'
import type { Task } from './task'
import type { TaskRun } from './task-run'

export * from './item'
export * from './queue'
export * from './queue-run'
export * from './task'
export * from './task-run'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  item: Array<Partial<Item>>
  queue: Array<Partial<Queue>>
  queue_run: Array<Partial<QueueRun>>
  task: Array<Partial<Task>>
  task_run: Array<Partial<TaskRun>>
}
