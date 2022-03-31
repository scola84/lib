import { isArray } from './is-array'
import { isObject } from './is-object'

export function get (value: unknown, path: unknown[] | string): unknown {
  let result: unknown = value
  let steps = path

  if (typeof steps === 'string') {
    steps = steps.split('.')
  }

  for (const key of steps) {
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
