import type { Struct } from './is-struct'
import { isStruct } from './is-struct'

export function flatten<T> (struct: Struct, prefix = ''): Struct<T> {
  return Object
    .entries(struct)
    .reduce((result, [key, value]) => {
      if (isStruct(value)) {
        return {
          ...result,
          ...flatten(value, `${prefix}${key}.`)
        }
      }

      return {
        ...result,
        [`${prefix}${key}`]: value
      }
    }, {})
}
