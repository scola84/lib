import { isNil } from './is-nil'
import { isPrimitive } from './is-primitive'

export function isSame (left: unknown, right: unknown): boolean {
  if ((
    isPrimitive(left) &&
    isPrimitive(right)
  ) || (
    isNil(left) &&
    isNil(right)
  )) {
    return left === right
  }

  return JSON.stringify(left) === JSON.stringify(right)
}
