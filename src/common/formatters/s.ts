import type { Formatter, Struct } from '../helpers'
import { cast, get, isNumber } from '../helpers'

export function s (name: string, locale: string, options: Struct<string | undefined>): Formatter {
  const encodeuri = cast(options.encodeuri)
  const slice = cast(options.slice)

  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  function formatter (data: unknown): string {
    let value = (cast(get(data, path)) ?? '').toString()

    if (encodeuri === true) {
      value = encodeURIComponent(value)
    }

    if (isNumber(slice)) {
      value = value.slice(0, Number(slice))
    }

    return value
  }

  return formatter
}
