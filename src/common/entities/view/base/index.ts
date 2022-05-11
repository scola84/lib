import type { View } from './view'
import type { ViewGroup } from './view-group'
import type { ViewUser } from './view-user'

export * from './view'
export * from './view-group'
export * from './view-user'

export interface Entities extends Record<string, Array<Partial<unknown>>> {
  view: Array<Partial<View>>
  view_group: Array<Partial<ViewGroup>>
  view_user: Array<Partial<ViewUser>>
}
