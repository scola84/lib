import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function step (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  if ((Number(data[name]) % (field.step ?? 0)) !== 0) {
    errors[name] = {
      code: 'err_validator_step_mismatch',
      data: { step: field.step }
    }

    return false
  }

  return true
}
