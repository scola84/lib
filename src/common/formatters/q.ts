import { cast, flatten, get, isStruct } from '../helpers'
import type { Formatter } from '../helpers'

export function q (name: string): Formatter {
  const path = name
    .split('.')
    .map(cast)
    .filter((key) => {
      return key !== ''
    })

  return (data: unknown): string => {
    const value = get(data, path)

    if (isStruct(value)) {
      return new URLSearchParams(flatten(value)).toString()
    }

    return ''
  }
}
