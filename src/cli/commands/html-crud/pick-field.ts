import type { SchemaField } from '../../../server/helpers/schema'
import type { Struct } from '../../../common'

export function pickField (field: SchemaField): Struct {
  return {
    accept: field.accept,
    custom: field.custom,
    default: field.default,
    max: field.max,
    maxLength: field.maxLength,
    min: field.min,
    minLength: field.minLength,
    pattern: field.pattern,
    required: field.required,
    schema: field.schema,
    step: field.step,
    type: field.type,
    value: field.value,
    values: field.values
  }
}
