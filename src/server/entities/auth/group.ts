import type { Group as GroupBase } from './base'

export interface Group extends GroupBase {
  date_created: Date

  date_updated: Date

  for_confirm: boolean | null

  for_register: boolean | null

  group_id: number

  name: string

}

export function createGroup (group?: Partial<Group>, date = new Date()): Group {
  return {
    date_created: group?.date_created ?? date,
    date_updated: group?.date_updated ?? date,
    for_confirm: group?.for_confirm ?? false,
    for_register: group?.for_register ?? false,
    group_id: group?.group_id ?? 0,
    name: group?.name ?? 'name'
  }
}
