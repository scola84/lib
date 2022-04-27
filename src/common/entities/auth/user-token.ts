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

export function createUserToken (userToken?: Partial<UserToken>, date = new Date()): UserToken {
  return {
    date_created: userToken?.date_created ?? date,
    date_expires: userToken?.date_expires ?? date,
    date_updated: userToken?.date_updated ?? date,
    group_id: userToken?.group_id ?? null,
    hash: userToken?.hash ?? 'hash',
    permissions: userToken?.permissions ?? null,
    role_id: userToken?.role_id ?? null,
    token_id: userToken?.token_id ?? 0,
    user_id: userToken?.user_id ?? 0
  }
}
