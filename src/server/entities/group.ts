export interface Group {
  date_created: Date

  date_updated: Date

  group_id: number | string

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
