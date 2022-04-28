import type { I18nFormatter, Struct } from '../helpers'
import { cast, get, isNumber } from '../helpers'

export function j (name: string, locale: string, options: Struct<string>): I18nFormatter {
  const space = cast(options.space)

  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  return (data: unknown): string => {
    const value = get(data, path)

    if (
      typeof space === 'string' ||
      isNumber(space)
    ) {
      return JSON.stringify(value, undefined, space)
    }

    return JSON.stringify(value)
  }
}
