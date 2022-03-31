import type { Struct } from './is-struct'
import { get } from './get'
import { isArray } from './is-array'
import { set } from './set'

export function setPush<T = Struct> (struct: T, name: string, value: unknown): T {
  let asArray = false
  let realName = name

  if (realName.endsWith('[]')) {
    asArray = true
    realName = realName.slice(0, -2)
  }

  let structValue = get(struct, realName)

  if (structValue === undefined) {
    if (asArray) {
      set(struct, realName, [value])
    } else {
      set(struct, realName, value)
    }
  } else {
    if (!isArray(structValue)) {
      structValue = [structValue]
      set(struct, realName, structValue)
    }

    if (isArray(structValue)) {
      structValue.push(value)
    }
  }

  return struct
}
