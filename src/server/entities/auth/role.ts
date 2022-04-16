import type { Role as RoleBase } from './base'
import type { Struct } from '../../../common'

export interface Role extends RoleBase {
  date_created: Date

  date_updated: Date

  expires: number

  name: string

  permissions: Struct

  role_id: number
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
