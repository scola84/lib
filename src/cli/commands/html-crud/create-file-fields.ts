import type { Schema } from '../../../server/helpers/schema'

export function createFileFields (schema: Schema): Schema {
  const fields = Object
    .entries(schema)
    .filter(([, field]) => {
      return field.type === 'file'
    })

  if (fields.length === 0) {
    return {}
  }

  return fields
    .reduce((result, [name]) => {
      result.file.values.push(name as never)
      return result
    }, {
      file: {
        type: 'select',
        values: []
      }
    })
}
