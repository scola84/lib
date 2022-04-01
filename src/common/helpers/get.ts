import { cast } from './cast'
import { isArray } from './is-array'
import { isObject } from './is-object'

export function get (value: unknown, path: unknown[] | string): unknown {
  let keys = path

  if (typeof keys === 'string') {
    keys = keys
      .split('.')
      .map(cast)
  }

  return keys.reduce((result, key) => {
    if (
      typeof key === 'number' &&
      isArray(result)
    ) {
      return result[key]
    } else if (
      typeof key === 'string' &&
      isObject(result)
    ) {
      return result[key]
    }

    return undefined
  }, value)
}
