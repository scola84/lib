import type { Struct } from '../../common'

export interface UserToken {
  created: Date

  expires: Date

  group_id: number | string

  hash: string

  ip?: string

  permissions: Struct

  token_id: number | string

  type: string

  updated: Date

  user_id: number | string
}

export function createUserToken (token: Partial<UserToken>): UserToken {
  const date = new Date()
  return {
    created: date,
    expires: token.expires ?? date,
    group_id: token.group_id ?? 0,
    hash: token.hash ?? '',
    ip: token.ip,
    permissions: token.permissions ?? {},
    token_id: 0,
    type: token.type ?? '',
    updated: date,
    user_id: token.user_id ?? 0
  }
}
