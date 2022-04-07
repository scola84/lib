import type { Formatter, Struct } from '../helpers'
import { cast, get } from '../helpers'

export function s (name: string, locale: string, options: Struct<string | undefined>): Formatter {
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
    regexp = new RegExp(match, 'u')
  }

  function formatter (data: unknown): string {
    let value = (cast(get(data, path)) ?? '').toString()

    if (regexp !== null) {
      [,value = ''] = value.match(regexp) ?? []
    }

    if (encodeuri === true) {
      value = encodeURIComponent(value)
    }

    return value
  }

  return formatter
}
