import type { Struct } from '../../common'
import type { Validator } from '../helpers'

export function operator (name: string): Validator {
  const operators = [
    '>',
    '<',
    '>=',
    '<=',
    '<>',
    'LIKE'
  ]

  return (data: Struct, errors: Struct) => {
    const value = String(data[name])

    if (!operators.includes(value)) {
      errors[name] = {
        code: 'err_validator_bad_input_operator',
        data: { values: operators }
      }

      return false
    }

    return true
  }
}
