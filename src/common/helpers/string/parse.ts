import type { Struct } from '../type'
import { cast } from '../type'

export function parse (string: string): Struct {
  return string
    .split('&')
    .reduce((object, parameter) => {
      const [name, value] = parameter.split('=')
      return {
        [name]: cast(value),
        ...object
      }
    }, {})
}
