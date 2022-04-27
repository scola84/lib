import type { UserGroupRole as UserGroupRoleBase } from './base'

export interface UserGroupRole extends UserGroupRoleBase {
  group_id: number

  role_id: number

  user_id: number
}
