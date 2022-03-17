import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import { cast } from '../../common'

export function pattern (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct) => {
    const value = cast(data[name]) ?? ''

    if (field.pattern?.test(value.toString()) === false) {
      errors[name] = {
        code: 'err_validator_pattern_mismatch',
        data: { pattern: field.pattern.source }
      }

      return false
    }

    return true
  }
}
