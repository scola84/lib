import type { View as ViewBase } from './base'

export interface View extends ViewBase {
  date_created: Date

  date_updated: Date

  name: string

  snippet: string | null

  view_id: number
}

export function createView (view?: Partial<View>, date = new Date()): View {
  return {
    date_created: view?.date_created ?? date,
    date_updated: view?.date_updated ?? date,
    name: view?.name ?? 'name',
    snippet: view?.snippet ?? null,
    view_id: view?.view_id ?? 0
  }
}
