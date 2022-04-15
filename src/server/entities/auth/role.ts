import type { Struct } from '../../../common'

export interface Role {
  date_created: Date

  date_updated: Date

  expires: number

  name: string

  permissions: Struct

  role_id: number | string
}

export function createRole (role?: Partial<Role>, date = new Date()): Role {
  return {
    date_created: date,
    date_updated: date,
    expires: 0,
    name: 'name',
    permissions: {},
    role_id: 0,
    ...role
  }
}
