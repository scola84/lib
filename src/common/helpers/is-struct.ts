export type Struct<Value = unknown> = Record<string, Value>

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
