import { isObject } from './is-object'

export interface Transaction {
  commit: unknown
  result?: unknown
  rollback?: unknown
  type: string
}

export function isTransaction (value: unknown): value is Transaction {
  return (
    isObject(value)
  ) && (
    value.commit !== undefined &&
    typeof value.type === 'string'
  )
}
