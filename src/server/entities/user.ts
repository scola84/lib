import type { Group } from './group'
import type { Role } from './role'
import type { Struct } from '../../common'
import type { UserToken } from './user-token'

export interface User {
  active: boolean

  codes: string | null

  compromised: boolean

  confirmed: boolean

  created: Date

  email: string | null

  email_prefs: Struct | null

  group?: Group

  group_id?: number | string

  hotp_email: string | null

  hotp_secret: string | null

  hotp_tel: string | null

  locale: string | null

  mfa: boolean

  name: string | null

  oauth_provider: string | null

  password: string | null

  role?: Role

  role_id?: number | string

  tel: string | null

  token?: UserToken

  totp_secret: string | null

  updated: Date

  user_id: number | string

  username: string | null

  webauthn_credentials: string | null
}

export function createUser (user?: Partial<User>, date = new Date()): User {
  return {
    active: true,
    codes: null,
    compromised: false,
    confirmed: false,
    created: date,
    email: null,
    email_prefs: null,
    hotp_email: null,
    hotp_secret: null,
    hotp_tel: null,
    locale: null,
    mfa: false,
    name: null,
    oauth_provider: null,
    password: null,
    tel: null,
    totp_secret: null,
    updated: date,
    user_id: 0,
    username: null,
    webauthn_credentials: null,
    ...user
  }
}
