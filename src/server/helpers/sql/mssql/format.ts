import { escape } from 'sqlstring'
import lodash from 'lodash'

export function format (value: unknown): string {
  return escape(lodash.isPlainObject(value) || typeof value === 'boolean'
    ? JSON.stringify(value)
    : value)
}
