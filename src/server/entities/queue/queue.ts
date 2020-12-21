import type { QueueRun } from './queue-run'
import type { Task } from './task'

export interface Queue {
  connection?: string | null
  created?: Date
  id?: string
  name: string
  previousQueue?: Queue
  previous_queue_id?: string | null
  queueRuns?: QueueRun[]
  query?: string | null
  schedule?: string | null
  scheduleBegin?: Date | null
  scheduleEnd?: Date | null
  scheduleNext?: Date | null
  tasks?: Task[]
  updated?: Date
}
