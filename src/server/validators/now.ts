import type { SchemaField } from '../helpers'
import type { Struct } from '../../common'

export function now (name: string, field: SchemaField, data: Struct): boolean | null {
  data[name] = new Date().toISOString()
  return true
}
