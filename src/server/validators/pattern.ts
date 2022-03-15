import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function pattern (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if (field.pattern?.test(String(data[name])) === false) {
    errors[name] = {
      code: 'err_validator_pattern_mismatch',
      data: { pattern: field.pattern.source }
    }

    return false
  }

  return true
}
