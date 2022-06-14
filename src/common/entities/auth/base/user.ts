export interface User {
  auth_codes: string | null
  auth_codes_confirmed: Date | null
  auth_hotp_email: string | null
  auth_hotp_email_confirmed: Date | null
  auth_hotp_tel: string | null
  auth_hotp_tel_confirmed: Date | null
  auth_hotp_tel_country_code: string | null
  auth_hotp_tel_national: string | null
  auth_mfa: boolean | null
  auth_password: string | null
  auth_password_confirmed: Date | null
  auth_totp: string | null
  auth_totp_confirmed: Date | null
  auth_webauthn: string | null
  auth_webauthn_confirmed: Date | null
  date_created: Date
  date_updated: Date
  email_auth_login: boolean | null
  email_auth_update: boolean | null
  i18n_locale: string | null
  i18n_time_zone: string | null
  identity_email: string | null
  identity_name: string | null
  identity_tel: string | null
  identity_tel_country_code: string | null
  identity_tel_national: string | null
  identity_username: string | null
  state_active: boolean | null
  state_compromised: boolean | null
  user_id: number
}
