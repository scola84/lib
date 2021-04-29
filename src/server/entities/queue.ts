import type { Connection } from '../helpers/sql'
import type { Queue as QueueBase } from './base'
import type { Task } from './task'

export interface Queue extends Required<QueueBase> {
  sql?: Connection
  tasks: Task[]
}

export function createQueue (): Queue {
  return {
    database: 'database',
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
