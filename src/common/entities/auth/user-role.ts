import type { UserRole as UserRoleBase } from './base'

export interface UserRole extends UserRoleBase {
  role_id: number
  user_id: number
}
