import type { I18nFormatter, Struct } from '../helpers'
import { cast, get } from '../helpers'

export function s (name: string, locale: string, options: Partial<Struct<string>>): I18nFormatter {
  const defaultValue = cast(options.default)
  const encode = cast(options.encode)
  const match = cast(options.match)

  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  let regexp: RegExp | null = null

  if (typeof match === 'string') {
    regexp = new RegExp(match, 'gu')
  }

  function formatter (data: unknown): string {
    let value = (cast(get(data, path)) ?? defaultValue ?? '').toString()

    if (regexp !== null) {
      value = value
        .match(regexp)
        ?.join('')
        .trim() ?? ''
    }

    if (encode === true) {
      value = encodeURIComponent(value)
    }

    return value
  }

  return formatter
}
