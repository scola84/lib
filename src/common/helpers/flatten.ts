import { Struct, isStruct } from './is-struct'

export function flatten<T> (struct: Struct, prefix = ''): Struct<T> {
  return Object
    .entries(struct)
    .reduce<Struct<T>>((result, [key, value]) => {
    /* eslint-disable @typescript-eslint/indent */
      if (isStruct(value)) {
        return {
          ...result,
          ...flatten<T>(value, `${prefix}${key}.`)
        }
      }

      return {
        ...result,
        [`${prefix}${key}`]: value as T
      }
    }, Struct.create<Struct<T>>())
    /* eslint-enable @typescript-eslint/indent */
}
