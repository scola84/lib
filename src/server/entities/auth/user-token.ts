import type { Struct } from '../../../common'
import type { UserToken as UserTokenBase } from './base'

export interface UserToken extends UserTokenBase {
  date_created: Date

  date_expires: Date

  date_updated: Date

  group_id: number | null

  hash: string

  permissions: Struct | null

  role_id: number | null

  token_id: number

  user_id: number
}

export function createUserToken (token: Partial<UserToken>, date = new Date()): UserToken {
  return {
    date_created: date,
    date_expires: date,
    date_updated: date,
    group_id: null,
    hash: 'hash',
    permissions: null,
    role_id: null,
    token_id: 0,
    user_id: 0,
    ...token
  }
}
