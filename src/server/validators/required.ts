import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import type { User } from '../entities'
import { isNil } from '../../common'

export function required (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct, user?: User) => {
    switch (field.value) {
      case '$created':
        data[name] = new Date()
        return true
      case '$group_id':
        data[name] = user?.group_id
        return true
      case '$user_id':
        data[name] = user?.user_id
        return true
      default:
        break
    }

    const value = data[name]

    if (
      isNil(value) ||
      value === ''
    ) {
      if (field.required === true) {
        if (field.value === undefined) {
          errors[name] = {
            code: 'err_validator_value_missing'
          }

          return false
        }

        data[name] = field.value
      } else {
        return null
      }
    }

    return true
  }
}
