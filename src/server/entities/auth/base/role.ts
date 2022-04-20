export interface Role {
  date_created: Date
  date_updated: Date
  expires: number
  for_confirm: boolean | null
  for_register: boolean | null
  name: string
  permissions: unknown
  require_confirm: boolean | null
  require_mfa: boolean | null
  role_id: number
}
