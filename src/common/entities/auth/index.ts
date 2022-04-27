import type { Group } from './group'
import type { Role } from './role'
import type { User } from './user'
import type { UserGroup } from './user-group'
import type { UserGroupRole } from './user-group-role'
import type { UserRole } from './user-role'
import type { UserToken } from './user-token'

export * from './group'
export * from './role'
export * from './user'
export * from './user-group'
export * from './user-group-role'
export * from './user-role'
export * from './user-token'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  group: Array<Partial<Group>>
  role: Array<Partial<Role>>
  user: Array<Partial<User>>
  user_group: Array<Partial<UserGroup>>
  user_group_role: Array<Partial<UserGroupRole>>
  user_role: Array<Partial<UserRole>>
  user_token: Array<Partial<UserToken>>
}
