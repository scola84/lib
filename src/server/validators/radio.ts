import type { SchemaField, Validator } from '../helpers'
import { ScolaError } from '../../common'

export function radio (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    if (field.values?.includes(data[name]) !== true) {
      errors[name] = new ScolaError({
        code: 'err_validator_bad_input_radio',
        data: {
          accept: field.values
        }
      })

      throw errors[name]
    }
  }
}
