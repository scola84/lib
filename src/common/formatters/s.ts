import type { Formatter, Struct } from '../helpers'
import { cast, get } from '../helpers'

export function s (name: string, locale: string, options: Partial<Struct<string>>): Formatter {
  const encodeuri = cast(options.encodeuri)
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
    let value = (cast(get(data, path)) ?? '').toString()

    if (regexp !== null) {
      value = value
        .match(regexp)
        ?.join('') ?? ''
    }

    if (encodeuri === true) {
      value = encodeURIComponent(value)
    }

    return value
  }

  return formatter
}
