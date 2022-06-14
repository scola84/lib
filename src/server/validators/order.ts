import { ScolaError } from '../../common'
import type { Validator } from '../helpers'

export function order (name: string): Validator {
  const values: unknown[] = [
    'asc',
    'desc'
  ]

  return (data, errors) => {
    const value = String(data[name]).toLowerCase()

    if (!values.includes(value)) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_order',
        data: {
          accept: values
        }
      })

      throw errors[name]
    }
  }
}
