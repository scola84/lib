import type { SchemaField, Validator } from '../helpers'
import { cast, isNil } from '../../common'
import type { Struct } from '../../common'
import type { User } from '../entities'

export function required (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct, user?: User) => {
    switch (field.default) {
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

    const value = cast(data[name]) ?? ''

    if (
      isNil(value) ||
      value.toString() === ''
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
}
