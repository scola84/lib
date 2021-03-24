import type { Queue as QueueQueueRunBase } from './base'
import type { Task } from './task'

export interface Queue extends Required<QueueQueueRunBase> {
  tasks: Task[]
}

export function createQueue (): Queue {
  return {
    connection: 'connection',
    date_created: new Date(),
    date_updated: new Date(),
    fkey_queue_id: 0,
    id: 0,
    name: 'name',
    query: '',
    schedule: '',
    schedule_begin: null,
    schedule_end: null,
    schedule_next: null,
    tasks: []
  }
}
