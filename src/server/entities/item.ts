import type { Item as ItemBase } from './base'

export interface Item<Payload = unknown> extends Required<ItemBase> {
  code: 'err' | 'ok' | 'pending'
  payload: Payload
}

export function createItem<Payload> (payload?: Payload): Item<Payload> {
  return {
    code: 'pending',
    date_created: new Date(),
    date_updated: new Date(),
    fkey_queue_run_id: 0,
    id: 0,
    payload: (payload ?? {}) as Payload
  }
}
