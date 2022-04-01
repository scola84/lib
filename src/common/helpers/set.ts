import { Struct } from './is-struct'
import { cast } from './cast'
import { isArray } from './is-array'
import { isObject } from './is-object'

export function set<T = unknown> (base: T, path: unknown[] | string, value: unknown): T {
  let parent: unknown = base
  let key: unknown = ''
  let steps = path

  if (typeof steps === 'string') {
    steps = steps.split('.').map(cast)
  }

  for (let index = 0; index < steps.length - 1; index += 1) {
    key = steps[index]

    if (
      typeof key === 'number' &&
      isArray(parent)
    ) {
      if (parent[key] === undefined) {
        if (typeof steps[index + 1] === 'number') {
          parent[key] = []
        } else {
          parent[key] = Struct.create()
        }
      }

      parent = parent[key]
    } else if (
      typeof key === 'string' &&
      isObject(parent)
    ) {
      if (parent[key] === undefined) {
        if (typeof steps[index + 1] === 'number') {
          parent[key] = []
        } else {
          parent[key] = Struct.create()
        }
      }

      parent = parent[key]
    } else {
      return base
    }
  }

  const parentKey = steps[steps.length - 1]

  if (
    typeof parentKey === 'number' &&
    isArray(parent)
  ) {
    parent[parentKey] = value
  } else if (
    typeof parentKey === 'string' &&
    isObject(parent)
  ) {
    parent[parentKey] = value
  }

  return base
}
