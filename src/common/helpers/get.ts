import { isArray } from './is-array'
import { isObject } from './is-object'

export function get (value: unknown, path: Array<number | string>): unknown {
  let result: unknown = value

  for (const key of path) {
    if (
      typeof key === 'number' &&
      isArray(result)
    ) {
      result = result[key]
    } else if (
      typeof key === 'string' &&
      isObject(result)
    ) {
      result = result[key]
    }
  }

  return result ?? undefined
}
