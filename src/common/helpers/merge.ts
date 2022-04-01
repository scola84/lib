import type { Struct } from './is-struct'
import { flatten } from './flatten'
import { set } from './set'

export function merge<T = Struct> (target: T, ...sources: Struct[]): T {
  sources
    .forEach((source) => {
      Object
        .entries((flatten(source)))
        .forEach(([key, value]) => {
          set(target, key, value)
        })
    })

  return target
}
