export interface Group {
  created: Date

  group_id: number | string

  name: string

  updated: Date
}

export function createGroup (group?: Partial<Group>, date = new Date()): Group {
  return {
    created: date,
    group_id: 0,
    name: 'group',
    updated: date,
    ...group
  }
}
