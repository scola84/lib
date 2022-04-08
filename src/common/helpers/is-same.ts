import { cast } from './cast'
import { isNil } from './is-nil'
import { isPrimitive } from './is-primitive'
import { isStruct } from './is-struct'

export function isSame (left: unknown, right: unknown): boolean {
  if ((
    isNil(left) &&
    isNil(right)
  ) || (
    isPrimitive(left) &&
    isPrimitive(right)
  )) {
    return left === right
  }

  if (
    isStruct(left) &&
    isStruct(right)
  ) {
    return Object
      .entries(left)
      .every(([name, value]) => {
        return cast(value)?.toString() === cast(right[name])?.toString()
      })
  }

  return JSON.stringify(left) === JSON.stringify(right)
}
