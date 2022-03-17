import type { Formatter, Struct } from '../helpers'
import { cast } from '../helpers'

export function s (name: string, locale: string, options: Struct<string | undefined>): Formatter {
  const {
    slice
  } = options

  function formatter (data: Struct): string {
    let value = (cast(data[name]) ?? '').toString()

    if (slice !== undefined) {
      value = value.slice(0, Number(slice))
    }

    return value
  }

  return formatter
}
