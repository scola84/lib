import type { Queue } from './queue'
import type { Run } from './run'
import type { Task } from './task'

export * from './queue'
export * from './run'
export * from './task'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  queue: Array<Partial<Queue>>
  run: Array<Partial<Run>>
  task: Array<Partial<Task>>
}
