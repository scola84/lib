import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'
import type { User } from '../entities'
import { isNil } from '../../common'

export function required (name: string, field: SchemaField, data: Struct, errors: Struct, user?: User): boolean | null {
  switch (field.default) {
    case '$created':
      data[name] = new Date()
      return true
    case '$group_id':
      data[name] = user?.group_id
      return true
    case '$updated':
      data[name] = new Date()
      return true
    case '$user_id':
      data[name] = user?.user_id
      return true
    default:
      break
  }

  if (
    isNil(data[name]) ||
    String(data[name]) === ''
  ) {
    if (field.required === true) {
      if (field.default === undefined) {
        errors[name] = {
          code: 'err_validator_value_missing'
        }

        return false
      }

      data[name] = field.default
    } else {
      return null
    }
  }

  return true
}
