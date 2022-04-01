import { cast } from './cast'
import { isObject } from './is-object'
import { setPush } from './set-push'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Struct<Value = unknown> implements Record<string, Value> {
  [key: string]: Value

  public static create<T = Struct>(base?: unknown): T {
    return Object.assign(Object.create(null), base) as T
  }

  public static fromJson<T = Struct>(json: unknown): T {
    if (Struct.isStruct(json)) {
      return json as unknown as T
    }

    if (isObject(json)) {
      return Struct.create<T>(json)
    }

    if (typeof json === 'string') {
      try {
        return Struct.create(JSON.parse(json.replace(/\\"/gu, '"')) as T)
      } catch (error: unknown) {
        //
      }
    }

    return Struct.create()
  }

  public static fromQuery<T = Struct>(query: unknown, keepEmpty = false): T {
    if (Struct.isStruct(query)) {
      return query as unknown as T
    }

    return decodeURI(String(query))
      .split('&')
      .reduce<T>((struct, keyValue) => {
      /* eslint-disable @typescript-eslint/indent */
        const [key, value] = keyValue.split('=')

        if (value === '') {
          if (keepEmpty) {
            return setPush(struct, key, null)
          }

          return struct
        }

        return setPush(struct, key, cast(value))
      }, Struct.create())
      /* eslint-enable @typescript-eslint/indent */
  }

  public static isStruct (value: unknown): value is Struct {
    return (
      Object.prototype.toString.call(value) === '[object Object]' &&
      Object.getPrototypeOf(value) === null
    )
  }
}

/**
 * Checks whether a value is a Struct.
 *
 * @param value - The value
 * @returns Whether the value is a Struct
 * @see https://github.com/lodash/lodash/blob/2da024c/isPlainObject.js#L30
 */
export function isStruct (value: unknown): value is Struct {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  if (Object.getPrototypeOf(value) === null) {
    return true
  }

  let prototype = value

  while (Object.getPrototypeOf(prototype) !== null) {
    prototype = Object.getPrototypeOf(prototype)
  }

  return Object.getPrototypeOf(value) === prototype
}
