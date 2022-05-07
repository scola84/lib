import { isNumber, isStruct } from '../../helpers'
import type { Group } from './group'
import type { Role } from './role'
import type { User as UserBase } from './base'
import type { UserToken } from './user-token'

export interface User extends UserBase {
  auth_codes: string | null

  auth_codes_confirmed: boolean | null

  auth_hotp?: string

  auth_hotp_email: string | null

  auth_hotp_email_confirmed: boolean | null

  auth_hotp_tel: string

  auth_hotp_tel_confirmed: boolean | null

  auth_hotp_tel_country_code: string | null

  auth_hotp_tel_national: string | null

  auth_mfa: boolean | null

  auth_password: string | null

  auth_totp: string | null

  auth_totp_confirmed: boolean | null

  auth_webauthn: string | null

  auth_webauthn_confirmed: boolean | null

  date_created: Date

  date_updated: Date

  email: string | null

  name: string | null

  group?: Group

  group_id?: number

  preferences: {
    auth_login_email?: boolean
    locale?: string
    theme?: string
    time_zone?: string
  }

  role?: Role

  role_id?: number

  state_active: boolean | null

  state_compromised: boolean | null

  tel: string

  tel_country_code: string | null

  tel_national: string | null

  token?: UserToken

  user_id: number

  username: string | null
}

export function isUser (value: unknown): value is User {
  return (
    isStruct(value)
  ) && (
    isNumber(value.user_id)
  )
}

// eslint-disable-next-line complexity
export function createUser (user?: Partial<User>, date = new Date()): User {
  return {
    auth_codes: user?.auth_codes ?? null,
    auth_codes_confirmed: user?.auth_codes_confirmed ?? false,
    auth_hotp_email: user?.auth_hotp_email ?? null,
    auth_hotp_email_confirmed: user?.auth_hotp_email_confirmed ?? false,
    auth_hotp_tel: `${user?.auth_hotp_tel_country_code ?? ''}${user?.auth_hotp_tel_national ?? ''}`,
    auth_hotp_tel_confirmed: user?.auth_hotp_tel_confirmed ?? false,
    auth_hotp_tel_country_code: user?.auth_hotp_tel_country_code ?? null,
    auth_hotp_tel_national: user?.auth_hotp_tel_national ?? null,
    auth_mfa: user?.auth_mfa ?? false,
    auth_password: user?.auth_password ?? null,
    auth_totp: user?.auth_totp ?? null,
    auth_totp_confirmed: user?.auth_totp_confirmed ?? false,
    auth_webauthn: user?.auth_webauthn ?? null,
    auth_webauthn_confirmed: user?.auth_webauthn_confirmed ?? false,
    date_created: user?.date_created ?? date,
    date_updated: user?.date_updated ?? date,
    email: user?.email ?? null,
    name: user?.name ?? null,
    preferences: user?.preferences ?? {},
    state_active: user?.state_active ?? false,
    state_compromised: user?.state_compromised ?? false,
    tel: `${user?.tel_country_code ?? ''}${user?.tel_national ?? ''}`,
    tel_country_code: user?.tel_country_code ?? null,
    tel_national: user?.tel_national ?? null,
    user_id: user?.user_id ?? 0,
    username: user?.username ?? null
  }
}
