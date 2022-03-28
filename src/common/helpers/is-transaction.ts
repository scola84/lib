import { isStruct } from './is-struct'

export interface ScolaTransaction {
  commit: unknown
  rollback?: unknown
  result?: unknown
  type: string
}

export function isTransaction (value: unknown): value is ScolaTransaction {
  return (
    isStruct(value) &&
    value.commit !== undefined &&
    typeof value.type === 'string'
  )
}
