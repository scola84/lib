import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function operator (name: string): Validator {
  const values: unknown[] = [
    '=',
    '>',
    '<',
    '>=',
    '<=',
    '<>',
    'LIKE'
  ]

  return (data, errors) => {
    if (!values.includes(data[name])) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_operator',
        data: {
          accept: values
        }
      })

      throw errors[name]
    }
  }
}
