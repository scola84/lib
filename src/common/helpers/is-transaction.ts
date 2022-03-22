import { isStruct } from './is-struct'

export interface Transaction {
  commit: unknown
  rollback?: unknown
  result?: unknown
  type: string
}

export function isTransaction (value: unknown): value is Transaction {
  return (
    isStruct(value) &&
    value.commit !== undefined &&
    typeof value.type === 'string'
  )
}
