import type { Struct } from '../../common'

export interface UserToken {
  created: Date

  expires: Date

  group_id: number | string | null

  hash: string

  permissions: Struct | null

  role_id: number | string | null

  token_id: number | string

  updated: Date

  user_id: number | string
}

export function createUserToken (token: Partial<UserToken>, date = new Date()): UserToken {
  return {
    created: date,
    expires: date,
    group_id: null,
    hash: '',
    permissions: null,
    role_id: null,
    token_id: 0,
    updated: date,
    user_id: 0,
    ...token
  }
}
