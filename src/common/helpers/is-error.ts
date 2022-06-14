import { isObject } from './is-object'
import { toString } from './to-string'

export interface ScolaErrorProperties {
  code: string
  data?: unknown
  message?: string
  name?: string
  status?: number
}

export class ScolaError implements Error {
  public code: string

  public data?: unknown

  public message: string

  public name: string

  public status?: number

  public get stack (): string | undefined {
    try {
      throw new Error()
    } catch (error: unknown) {
      return (error as Error).stack
    }
  }

  public constructor (properties: ScolaErrorProperties) {
    this.code = properties.code
    this.data = properties.data
    this.message = properties.message ?? ''
    this.name = properties.name ?? ''
    this.status = properties.status
  }

  public static fromError (error: unknown): ScolaError {
    if (isError(error)) {
      return new ScolaError(error)
    }

    return new ScolaError({
      code: 'err_unknown',
      message: toString(error)
    })
  }

  public toJSON (): unknown {
    return {
      code: this.code,
      data: this.data
    }
  }
}

export function isError (value: unknown): value is ScolaErrorProperties {
  return (
    isObject(value)
  ) && (
    typeof value.code === 'string' &&
    value.code.startsWith('err_')
  )
}
