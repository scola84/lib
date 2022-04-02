import { Struct, isStruct } from './is-struct'

export function flatten<T> (struct: Struct, prefix = '', count = Infinity): Struct<T> {
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
          ...flatten(value, `${prefix}${key}.`, count - 1)
        }
      }

      return {
        ...result,
        [`${prefix}${key}`]: value as T
      }
    }, Struct.create<Struct<T>>())
    /* eslint-enable @typescript-eslint/indent */
}
