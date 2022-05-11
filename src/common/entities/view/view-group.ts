import type { ViewGroup as ViewGroupBase } from './base'

export interface ViewGroup extends ViewGroupBase {
  default_for: string | null

  group_id: number

  view_id: number
}
