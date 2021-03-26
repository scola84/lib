import type { Task as TaskBase } from './base'

export interface Task<Options = unknown> extends Required<TaskBase> {
  options: Options
}

export function createTask<Options> (options: Options): Task<Options> {
  return {
    date_created: new Date(),
    date_updated: new Date(),
    fkey_queue_id: 0,
    id: 0,
    name: 'name',
    number: 0,
    options
  }
}
