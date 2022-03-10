import type { Entities as EntitiesBase } from './base'
import type { Group } from './group'
import type { GroupUserRole } from './group-user-role'
import type { Queue } from './queue'
import type { QueueRun } from './queue-run'
import type { QueueTask } from './queue-task'
import type { Role } from './role'
import type { User } from './user'
import type { UserToken } from './user-token'

export * from './group'
export * from './group-user-role'
export * from './queue'
export * from './queue-run'
export * from './queue-task'
export * from './role'
export * from './user'
export * from './user-token'

export interface Entities extends EntitiesBase {
  group: Array<Partial<Group>>
  group_user_role: Array<Partial<GroupUserRole>>
  queue: Array<Partial<Queue>>
  queue_run: Array<Partial<QueueRun>>
  queue_task: Array<Partial<QueueTask>>
  role: Array<Partial<Role>>
  user: Array<Partial<User>>
  user_token: Array<Partial<UserToken>>
}
