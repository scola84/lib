import { isObject } from './is-object'

export interface ScolaErrorProperties {
  code: string
  data?: unknown
  message?: string
}

export class ScolaError {
  public code: string

  public data?: unknown

  public message?: string

  public constructor (properties: ScolaErrorProperties) {
    this.code = properties.code
    this.data = properties.data
    this.message = properties.message
  }
}

export function isError (value: unknown): value is ScolaErrorProperties {
  return (
    isObject(value)
  ) && (
    typeof value.code === 'string' &&
    value.code.startsWith('err_')
  ) && (
    value.message === undefined ||
    typeof value.message === 'string'
  )
}
