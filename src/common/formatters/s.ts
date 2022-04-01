import type { Formatter, Struct } from '../helpers'
import { cast } from '../helpers'
import { get } from '../helpers/get'

export function s (name: string, locale: string, options: Struct<string | undefined>): Formatter {
  const { slice } = options

  const path = name
    .split('.')
    .map(cast)

  function formatter (data: unknown): string {
    let value = (cast(get(data, path)) ?? '').toString()

    if (slice !== undefined) {
      value = value.slice(0, Number(slice))
    }

    return value
  }

  return formatter
}
