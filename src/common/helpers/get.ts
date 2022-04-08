import { cast } from './cast'
import { isArray } from './is-array'
import { isNumber } from './is-number'
import { isObject } from './is-object'

export function get (value: unknown, path: unknown[] | string): unknown {
  let keys = path

  if (typeof keys === 'string') {
    keys = keys
      .split('.')
      .map(cast)
      .filter((key) => {
        return key !== ''
      })
  }

  if (keys.length === 0) {
    return value
  }

  return keys.reduce((result, key) => {
    if (
      isNumber(key) &&
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
