import { isArray, isFile } from '../../common'
import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'
import { isMatch } from 'micromatch'

export function file (name: string, field: SchemaField, data: Struct, errors: Struct): boolean | null {
  let values = data[name]

  if (!isArray(values)) {
    values = [values]
  }

  if (isArray(values)) {
    const valid = values.every((value) => {
      return (
        isFile(value) && (
          !Array.isArray(field.accept) ||
          isMatch(value.type, field.accept)
        )
      )
    })

    if (!valid) {
      errors[name] = {
        code: 'err_validator_bad_input_file',
        data: { accept: field.accept }
      }

      return false
    }
  }

  return true
}
