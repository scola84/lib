export interface Role {
  date_created: Date
  date_updated: Date
  expires: number
  for_register: boolean | null
  name: string
  permissions: unknown
  require_mfa: boolean | null
  role_id: number
}
