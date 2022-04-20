import type { SchemaField, Validator } from '../helpers'
import type { Struct } from '../../common'
import type { User } from '../entities'
import { isNil } from '../../common'

export function required (name: string, field: SchemaField): Validator {
  return (data: Struct, errors: Struct, user?: User) => {
    switch (field.var) {
      case '$created':
        data[name] = new Date()
        return
      case '$group_id':
        data[name] = user?.group_id
        return
      case '$user_id':
        data[name] = user?.user_id
        return
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

          throw errors[name]
        }

        data[name] = field.value
      } else {
        throw null as unknown as Error
      }
    }
  }
}
