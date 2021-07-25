import { isObject } from './is-object'

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
