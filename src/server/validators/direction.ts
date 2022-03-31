import type { Struct } from '../../common'
import type { Validator } from '../helpers'
import { isArray } from '../../common'

export function direction (name: string): Validator {
  const directions = [
    'asc',
    'desc'
  ]

  return (data: Struct, errors: Struct) => {
    let values = data[name]

    if (!isArray(values)) {
      values = [values]
    }

    if (isArray(values)) {
      const valid = values
        .map((value) => {
          return String(value).toLowerCase()
        })
        .every((value) => {
          return directions.includes(value)
        })

      if (!valid) {
        errors[name] = {
          code: 'err_validator_bad_input_direction',
          data: { values: directions }
        }

        return false
      }
    }

    return true
  }
}
