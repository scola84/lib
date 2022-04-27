export interface UserToken {
  date_created: Date
  date_expires: Date
  date_updated: Date
  group_id: number | null
  hash: string | null
  permissions: unknown | null
  role_id: number | null
  token_id: number
  user_id: number
}
