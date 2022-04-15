import type { SchemaField } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'

export function pickField (field: SchemaField): Struct {
  let required = field.required

  if (required === false) {
    required = undefined
  }

  return {
    accept: field.accept,
    custom: field.custom,
    max: field.max,
    maxLength: field.maxLength,
    min: field.min,
    minLength: field.minLength,
    pattern: field.pattern,
    required: required,
    schema: field.schema,
    step: field.step,
    type: field.type,
    value: field.value,
    values: field.values,
    var: field.var
  }
}
