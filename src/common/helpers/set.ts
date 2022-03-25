/* eslint-disable max-lines-per-function */
import { isArray } from './is-array'
import { isObject } from './is-object'

export function set (base: unknown, path: unknown[], value: unknown): void {
  let parent: unknown = base
  let key: unknown = ''

  for (let index = 0; index < path.length - 1; index += 1) {
    key = path[index]

    if (
      typeof key === 'number' &&
      isArray(parent)
    ) {
      if (parent[key] === undefined) {
        if (typeof path[index + 1] === 'number') {
          parent[key] = []
        } else {
          parent[key] = {}
        }
      }

      parent = parent[key]
    } else if (
      typeof key === 'string' &&
      isObject(parent)
    ) {
      if (parent[key] === undefined) {
        if (typeof path[index + 1] === 'number') {
          parent[key] = []
        } else {
          parent[key] = {}
        }
      }

      parent = parent[key]
    } else {
      return
    }
  }

  const parentKey = path[path.length - 1]

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
}
