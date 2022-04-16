import type { Group } from './group'
import type { Role } from './role'
import type { User as UserBase } from './base'
import type { UserToken } from './user-token'

export interface User extends UserBase {
  auth_codes: string | null

  auth_codes_confirmed: boolean

  auth_hotp?: string

  auth_hotp_email: string | null

  auth_hotp_email_confirmed: boolean

  auth_hotp_tel: string | null

  auth_hotp_tel_confirmed: boolean

  auth_mfa: boolean

  auth_password: string | null

  auth_totp: string | null

  auth_totp_confirmed: boolean

  auth_webauthn: string | null

  auth_webauthn_confirmed: boolean

  date_created: Date

  date_updated: Date

  email: string | null

  name: string | null

  group?: Group

  group_id?: number

  preferences: {
    auth_login_email?: boolean
    locale?: string
  }

  role?: Role

  role_id?: number

  state_active: boolean

  state_compromised: boolean

  state_confirmed: boolean

  tel: string | null

  token?: UserToken

  user_id: number

  username: string | null
}

export function createUser (user?: Partial<User>, date = new Date()): User {
  return {
    auth_codes: null,
    auth_codes_confirmed: false,
    auth_hotp_email: null,
    auth_hotp_email_confirmed: false,
    auth_hotp_tel: null,
    auth_hotp_tel_confirmed: false,
    auth_mfa: false,
    auth_password: null,
    auth_totp: null,
    auth_totp_confirmed: false,
    auth_webauthn: null,
    auth_webauthn_confirmed: false,
    date_created: date,
    date_updated: date,
    email: null,
    name: null,
    preferences: {},
    state_active: false,
    state_compromised: false,
    state_confirmed: false,
    tel: null,
    user_id: 0,
    username: null,
    ...user
  }
}
