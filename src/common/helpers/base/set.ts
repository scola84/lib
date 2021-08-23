import { isObject } from './is-object'

/**
 * Sets a value at a given path in an object.
 *
 * @param object - The object
 * @param path - The path
 * @param value - The value
 * @returns The object
 *
 * @example
 * ```ts
 * const object = set({}, 'ab.cd[0].ef', 'ef')
 * const value = object.ab.cd[0].ef
 * console.log(value) // value = 'ef'
 * ```
 */
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
