/**
 * Checks whether a value is a plain object.
 *
 * @param value - The value
 * @returns The result
 * @see https://github.com/lodash/lodash/blob/2da024c/isPlainObject.js#L30
 */
export function isObject (value: unknown): value is Record<string, unknown> {
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
