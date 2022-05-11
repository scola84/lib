import type { ViewUser as ViewUserBase } from './base'

export interface ViewUser extends ViewUserBase {
  default_for: string | null

  user_id: number

  view_id: number
}
