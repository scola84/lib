import { Struct } from './is-struct'
import { cast } from './cast'
import { isArray } from './is-array'
import { isObject } from './is-object'

export function set<T = unknown> (base: T, path: unknown[] | string, value: unknown): T {
  let parent: unknown = base
  let keys = path

  if (typeof keys === 'string') {
    keys = keys
      .split('.')
      .map(cast)
  }

  for (let index = 0, key; index < keys.length - 1; index += 1) {
    key = keys[index]

    if (
      typeof key === 'number' &&
      isArray(parent)
    ) {
      if (parent[key] === undefined) {
        if (typeof keys[index + 1] === 'number') {
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
        if (typeof keys[index + 1] === 'number') {
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

  const parentKey = keys[keys.length - 1]

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
