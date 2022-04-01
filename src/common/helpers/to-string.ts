import { isObject } from './is-object'

export function toString (value: unknown): string {
  if (isObject(value)) {
    if (typeof value.message === 'string') {
      return value.message
    }

    return JSON.stringify(value)
  }

  return String(value)
}
