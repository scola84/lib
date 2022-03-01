import { cast } from './cast'
import { isNil } from './is-nil'
import { isPrimitive } from './is-primitive'
import { isStruct } from './is-struct'

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

  if (
    isStruct(left) &&
    isStruct(right)
  ) {
    return Object
      .entries(left)
      .every(([name, value]) => {
        return cast(value) === cast(right[name])
      })
  }

  return JSON.stringify(left) === JSON.stringify(right)
}
