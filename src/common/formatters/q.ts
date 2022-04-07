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
    const values = get(data, path)

    if (isStruct(values)) {
      return Object
        .entries(flatten(values))
        .map(([key, value]) => {
          return `${key}=${cast(value)?.toString() ?? ''}`
        })
        .join('&')
    }

    return ''
  }
}
