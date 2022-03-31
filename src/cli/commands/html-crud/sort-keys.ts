import type { Struct } from '../../../common'

export function sortKeys<T> (struct: Struct): T {
  return Object
    .entries(struct)
    .sort(([left], [right]) => {
      if (left < right) {
        return -1
      }

      return 1
    })
    .reduce((result, [name, field]) => {
      return {
        ...result,
        [name]: field
      }
    }, {}) as T
}
