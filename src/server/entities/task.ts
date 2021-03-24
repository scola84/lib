import type { Task as TaskBase } from './base'

export interface Task<Options = unknown> extends Required<TaskBase> {
  options: Options
}
