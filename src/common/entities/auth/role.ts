import type { Role as RoleBase } from './base'
import type { Struct } from '../../../common'

export interface Role extends RoleBase {
  date_created: Date

  date_updated: Date

  expires: number

  for_confirm: boolean | null

  for_register: boolean | null

  name: string

  permissions: Struct

  require_confirm: boolean | null

  require_mfa: boolean | null

  role_id: number

}

export function createRole (role?: Partial<Role>, date = new Date()): Role {
  return {
    date_created: role?.date_created ?? date,
    date_updated: role?.date_updated ?? date,
    expires: role?.expires ?? 0,
    for_confirm: role?.for_confirm ?? false,
    for_register: role?.for_register ?? false,
    name: role?.name ?? 'name',
    permissions: role?.permissions ?? {},
    require_confirm: role?.require_confirm ?? false,
    require_mfa: role?.require_mfa ?? false,
    role_id: role?.role_id ?? 0
  }
}
