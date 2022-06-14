import type { SchemaField, Validator } from '../helpers'
import { ScolaError, isArray, isFile } from '../../common'
import { isMatch } from 'micromatch'

export function file (name: string, field: SchemaField): Validator {
  return (data, errors) => {
    let values = data[name]

    if (
      !isArray(values) &&
      field.strict === false
    ) {
      values = [values]
    }

    if (isArray(values)) {
      const valid = values.every((value) => {
        return ((
          isFile(value)
        ) && (
          !Array.isArray(field.accept) ||
          isMatch(value.type, field.accept)
        ))
      })

      if (!valid) {
        errors[name] = new ScolaError({
          code: 'err_validator_bad_input_file',
          data: {
            accept: field.accept
          }
        })

        throw errors[name]
      }
    }
  }
}
