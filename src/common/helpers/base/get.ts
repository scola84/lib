import { isObject } from './is-object'

/**
 * Returns the value at a given path in an object.
 *
 * @param object - The object
 * @param path - The path
 * @returns The value
 *
 * @example
 * ```ts
 * const object = {
 *   ab: {
 *     cd: [{
 *       ef: 'ef
 *     }]
 *   }
 * }
 *
 * const value = get(object, 'ab.cd[0].ef')
 * console.log(value) // value = 'ef'
 * ```
 */
export function get<T> (object: T, path: string): unknown {
  if (isObject(object)) {
    return path
      .split(/\]?\.|\[/u)
      .reduce<Record<string, unknown> | undefined>((source, key) => {
      if (source?.[key] !== undefined) {
        return source[key] as Record<string, unknown>
      }

      return undefined
    }, object)
  }

  return undefined
}
