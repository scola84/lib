import type { Group as GroupBase } from './base'

export interface Group extends GroupBase {
  date_created: Date

  date_updated: Date

  group_id: number

  name: string
}

export function createGroup (group?: Partial<Group>, date = new Date()): Group {
  return {
    date_created: date,
    date_updated: date,
    group_id: 0,
    name: 'name',
    ...group
  }
}
