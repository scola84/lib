import type { Entities as EntitiesBase } from './base'
import type { Queue } from './queue'
import type { QueueRun } from './queue-run'
import type { QueueTask } from './queue-task'

export * from './queue'
export * from './queue-run'
export * from './queue-task'

export interface Entities extends EntitiesBase {
  queue: Array<Partial<Queue>>
  queue_run: Array<Partial<QueueRun>>
  queue_task: Array<Partial<QueueTask>>
}
