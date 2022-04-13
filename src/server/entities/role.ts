import type { Struct } from '../../common'

export interface Role {
  created: Date

  expires: number

  name: string

  permissions: Struct

  role_id: number | string

  updated: Date
}

export function createRole (role?: Partial<Role>): Role {
  return {
    created: new Date(),
    expires: 24 * 60 * 60 * 1000,
    name: 'role',
    permissions: {},
    role_id: 0,
    updated: new Date(),
    ...role
  }
}
