import type { Struct } from './is-struct'
import { isNil } from './is-nil'

export function absorb (left: Struct, right?: Struct, keepEmpty = false): Struct {
  const result: Struct = {}

  Object
    .entries(left)
    .forEach(([key, leftValue]) => {
      const rightValue = right?.[key]

      if (
        !isNil(rightValue) &&
        rightValue !== ''
      ) {
        result[key] = rightValue
      } else if (
        keepEmpty || (
          !isNil(leftValue) &&
          leftValue !== ''
        )
      ) {
        result[key] = leftValue
      }
    })

  return result
}
