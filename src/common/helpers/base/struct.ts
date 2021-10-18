import { cast } from './cast'
import { isPrimitive } from './is-primitive'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Struct<Value = unknown> implements Record<string, Value> {
  [key: string]: Value

  public static parse (string: string, values?: Struct): Struct {
    return Struct
      .replace(string, values)
      .split('&')
      .reduce((object, parameter) => {
        const [name, value] = parameter.split('=')
        return {
          [name]: cast(value),
          ...object
        }
      }, {})
  }

  public static replace (string: string, values?: Struct): string {
    return string
      .match(/:[a-z]\w+/gu)
      ?.reduce((result, match) => {
        const regExp = new RegExp(match, 'gu')
        const value = values?.[match.slice(1)]

        if (isPrimitive(value)) {
          return result.replace(regExp, value.toString())
        }

        return result.replace(regExp, '')
      }, string) ?? string
  }
}
