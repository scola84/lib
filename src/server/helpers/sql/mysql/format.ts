import { escape } from 'sqlstring'
import lodash from 'lodash'

export function format (value: unknown): string {
  return escape(lodash.isPlainObject(value) ? JSON.stringify(value) : value)
}
