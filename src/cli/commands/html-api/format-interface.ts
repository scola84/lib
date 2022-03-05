import type { Struct } from '../../../common'
import { formatGroup } from './format-group'

export function formatInterface (struct: Struct<Struct>, space: number): string {
  return formatGroup(
    Object
      .entries(struct)
      .map(([name, field]) => {
        let key = name

        if (field.required !== true) {
          key += '?'
        }

        if (field.type === 'number') {
          return `${key}: number`
        }

        return `${key}: string`
      }),
    space,
    ['{', '}'],
    ''
  )
}
