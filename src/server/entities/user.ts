import type { Role } from './role'
import type { UserToken } from './user-token'

export interface User {
  active: boolean

  created: Date

  group_id: number | string

  groups?: string

  hash: string

  role: Role

  token?: UserToken

  updated: Date

  user_id: number | string

  username: string
}
