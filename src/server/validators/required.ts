import type { SchemaField, Validator } from '../helpers'
import { ScolaError, isNil } from '../../common'
import type { User } from '../../common'

export function required (name: string, field: SchemaField): Validator {
  return (data, errors, user?: User) => {
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
          errors[name] = new ScolaError({
            code: 'err_validator_value_missing'
          })

          throw errors[name]
        }

        data[name] = field.value
      } else {
        throw null as unknown as Error
      }
    }
  }
}
