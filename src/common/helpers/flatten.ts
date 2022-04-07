import { Struct, isStruct } from './is-struct'

export interface FlattenOptions {
  count?: number
  prefix?: string
}

export function flatten<T> (struct: Struct, options: FlattenOptions = {}): Struct<T> {
  const {
    count = Infinity,
    prefix = ''
  } = options

  return Object
    .entries(struct)
    .reduce<Struct<T>>((result, [key, value]) => {
    /* eslint-disable @typescript-eslint/indent */
      if (
        isStruct(value) &&
        count > 0
      ) {
        return {
          ...result,
          ...flatten(value, {
            count: count - 1,
            prefix: `${prefix}${key}.`
          })
        }
      }

      return {
        ...result,
        [`${prefix}${key}`]: value as T
      }
    }, Struct.create<Struct<T>>())
    /* eslint-enable @typescript-eslint/indent */
}
