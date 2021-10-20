import type { Struct } from '../type'
import { isPrimitive } from '../type'

export function format (string: string, values?: Struct): string {
  return string
    .match(/:[a-z]\w+/gu)
    ?.reduce((result, match) => {
      const regExp = new RegExp(match, 'gu')
      const value = values?.[match.slice(1)]

      if (isPrimitive(value)) {
        return result.replace(regExp, value.toString())
      }

      return result.replace(regExp, '')
    }, string) ?? string
}
