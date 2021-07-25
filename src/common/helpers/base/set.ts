import { isObject } from './is-object'

export function set<T> (object: T, path: string, value: unknown): T {
  if (isObject(object)) {
    path
      .split(/\]?\.|\[/u)
      .reduce<Record<string, unknown>>((result, key, index, keys) => {
      if (index === keys.length - 1) {
        result[key] = value
      } else if (result[key] === undefined) {
        if (((/^\d+$/u).exec(keys[index + 1])) === null) {
          result[key] = {}
        } else {
          result[key] = []
        }
      }

      return result[key] as Record<string, unknown>
    }, object)
  }

  return object
}
