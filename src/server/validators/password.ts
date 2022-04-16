import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { isPrimitive } from '../../common'

export function password (name: string): Validator {
  return (data: Struct) => {
    const value = data[name]

    if (isPrimitive(value)) {
      data[name] = value.toString()
      return true
    }

    return false
  }
}
