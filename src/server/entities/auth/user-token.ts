import type { Struct } from '../../../common'

export interface UserToken {
  date_created: Date

  date_expires: Date

  date_updated: Date

  group_id: number | string | null

  hash: string

  permissions: Struct | null

  role_id: number | string | null

  token_id: number | string

  user_id: number | string
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
