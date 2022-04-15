import type { Group } from './auth/group'
import type { Queue } from './queue/queue'
import type { QueueRun } from './queue/queue-run'
import type { QueueTask } from './queue/queue-task'
import type { Role } from './auth/role'
import type { User } from './auth/user'
import type { UserRole } from './auth/user-role'
import type { UserRoleGroup } from './auth/user-role-group'
import type { UserToken } from './auth/user-token'

export * from './auth/group'
export * from './auth/role'
export * from './auth/user'
export * from './auth/user-role'
export * from './auth/user-role-group'
export * from './auth/user-token'
export * from './/queue/queue'
export * from './queue/queue-run'
export * from './queue/queue-task'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  queue: Array<Partial<Queue>>
  queue_run: Array<Partial<QueueRun>>
  queue_task: Array<Partial<QueueTask>>
  group: Array<Partial<Group>>
  group_user_role: Array<Partial<UserRoleGroup>>
  role: Array<Partial<Role>>
  user: Array<Partial<User>>
  user_role: Array<Partial<UserRole>>
  user_token: Array<Partial<UserToken>>
}
