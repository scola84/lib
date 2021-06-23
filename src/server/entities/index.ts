import type { Entities as EntitiesBase } from './base'
import type { Queue } from './queue'
import type { QueueRun } from './queue-run'
import type { TaskRun } from './task-run'

export * from './queue'
export * from './queue-run'
export * from './task-run'

export interface Entities extends EntitiesBase {
  queue: Array<Partial<Queue>>
  queue_run: Array<Partial<QueueRun>>
  task_run: Array<Partial<TaskRun>>
}
