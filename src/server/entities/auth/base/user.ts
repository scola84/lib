export interface User {
  auth_codes: string | null
  auth_codes_confirmed: boolean
  auth_hotp_email: string | null
  auth_hotp_email_confirmed: boolean
  auth_hotp_tel: string | null
  auth_hotp_tel_confirmed: boolean
  auth_mfa: boolean | null
  auth_password: string | null
  auth_totp: string | null
  auth_totp_confirmed: boolean
  auth_webauthn: string | null
  auth_webauthn_confirmed: boolean
  date_created: Date
  date_updated: Date
  email: string | null
  name: string | null
  preferences: unknown | null
  state_active: boolean | null
  state_compromised: boolean | null
  state_confirmed: boolean | null
  tel: string | null
  user_id: number
  username: string | null
}
