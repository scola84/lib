import { isNumber, isStruct } from '../../helpers'
import type { Group } from './group'
import type { Role } from './role'
import type { Struct } from '../../helpers'
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

  email_auth_login: boolean | null

  email_auth_update: boolean | null

  group?: Group

  group_id?: number

  identity_email: string | null

  identity_name: string | null

  identity_tel: string

  identity_tel_country_code: string | null

  identity_tel_national: string | null

  identity_username: string | null

  role?: Role

  role_id?: number

  state_active: boolean | null

  state_compromised: boolean | null

  token?: UserToken

  user_id: number

  views?: Struct
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
    email_auth_login: user?.email_auth_login ?? false,
    email_auth_update: user?.email_auth_update ?? false,
    i18n_locale: user?.i18n_locale ?? null,
    i18n_time_zone: user?.i18n_time_zone ?? null,
    identity_email: user?.identity_email ?? null,
    identity_name: user?.identity_name ?? null,
    identity_tel: `${user?.identity_tel_country_code ?? ''}${user?.identity_tel_national ?? ''}`,
    identity_tel_country_code: user?.identity_tel_country_code ?? null,
    identity_tel_national: user?.identity_tel_national ?? null,
    identity_username: user?.identity_username ?? null,
    state_active: user?.state_active ?? false,
    state_compromised: user?.state_compromised ?? false,
    user_id: user?.user_id ?? 0
  }
}

export function isUser (value: unknown, detached = false): value is User {
  if (detached) {
    return (
      isStruct(value)
    ) && (
      typeof value.identity_email === 'string' ||
      typeof value.identity_name === 'string' ||
      typeof value.identity_tel_national === 'string'
    )
  }

  return (
    isStruct(value)
  ) && (
    isNumber(value.user_id)
  )
}
