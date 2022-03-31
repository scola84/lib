import { cast } from './cast'
import { setPush } from './set-push'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Struct<Value = unknown> implements Record<string, Value> {
  [key: string]: Value

  public static create<T = Struct>(base?: T): T {
    return Object.assign(Object.create(null), base) as T
  }

  public static fromString<T = Struct>(string: string, keepEmpty = false): T {
    return string
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
    return isStruct(value)
  }
}

/**
 * Checks whether a value is a plain object.
 *
 * @param value - The value
 * @returns Whether the value is a struct
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
