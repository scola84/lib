import type { Struct } from './is-struct'
import { isArray } from 'lodash'

export function setPush (struct: Struct, name: string, value: unknown): void {
  if (struct[name] === undefined) {
    struct[name] = value
  } else {
    let structValue = struct[name]

    if (!isArray(structValue)) {
      structValue = [struct[name]]
      struct[name] = structValue
    }

    if (isArray(structValue)) {
      structValue.push(value)
    }
  }
}
