import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { isArray } from '../../common'

export function order (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    let values = data[name]

    if (
      !isArray(values) &&
      field.strict !== true
    ) {
      values = [values]
    }

    if (isArray(values)) {
      const valid = values
        .map((value) => {
          return String(value)
        })
        .every((value) => {
          const { direction = '' } = value.match(/(?<direction>[<>])$/u)?.groups ?? {}
          return field.values?.includes(value.slice(0, value.length - direction.length))
        })

      if (!valid) {
        errors[name] = {
          code: 'err_validator_bad_input_order',
          data: { values: field.values }
        }

        return false
      }
    }

    return true
  }
}
