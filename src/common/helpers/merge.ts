import type { Struct } from './is-struct'
import { flatten } from './flatten'
import { set } from './set'

export function merge (target: Struct, ...sources: Struct[]): Struct {
  sources
    .forEach((merger) => {
      Object
        .entries((flatten(merger)))
        .forEach(([key, value]) => {
          set(target, key.split('.'), value)
        })
    })

  return target
}
