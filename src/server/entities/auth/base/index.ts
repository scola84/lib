import type { Group } from './group'
import type { Role } from './role'
import type { User } from './user'
import type { UserRole } from './user-role'
import type { UserRoleGroup } from './user-role-group'
import type { UserToken } from './user-token'

export * from './group'
export * from './role'
export * from './user'
export * from './user-role'
export * from './user-role-group'
export * from './user-token'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  group: Array<Partial<Group>>
  role: Array<Partial<Role>>
  user: Array<Partial<User>>
  user_role: Array<Partial<UserRole>>
  user_role_group: Array<Partial<UserRoleGroup>>
  user_token: Array<Partial<UserToken>>
}
