import type { UserRoleGroup as UserRoleGroupBase } from './base'

export interface UserRoleGroup extends UserRoleGroupBase{
  group_id: number

  role_id: number

  user_id: number
}
