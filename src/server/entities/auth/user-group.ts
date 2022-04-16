import type { UserGroup as UserGroupBase } from './base'

export interface UserGroup extends UserGroupBase {
  group_id: number

  user_id: number
}
