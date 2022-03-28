import { isStruct } from './is-struct'

export interface ScolaError {
  code: string
  data?: unknown
  message?: string
}

export function isError (value: unknown): value is ScolaError {
  return (
    isStruct(value) &&
    typeof value.code === 'string'
  )
}
