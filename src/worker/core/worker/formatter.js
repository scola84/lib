import get from 'lodash/get.js'
import qs from 'qs'
import { formatter } from './formatter/index.js'

const regexpBase = '%((\\(([\\w.]+)\\))?((\\d+)\\$)?)([dfmns])(\\[([^\\]]+)\\])?'
const regexpGlobal = new RegExp(regexpBase, 'g')
const regexpSingle = new RegExp(regexpBase)

export class Formatter {
  static format (string, args = [], locale = 'nl_NL') {
    const matches = string.match(regexpGlobal) || []

    let match = null
    let name = null
    let options = null
    let position = null
    let result = string
    let type = null
    let value = null

    for (let i = 0; i < matches.length; i += 1) {
      [
        match, , , name, , position, type, , options = ''
      ] = matches[i].match(regexpSingle)

      options = qs.parse(options, {
        decoder: (v) => v
      })

      if (typeof position === 'string') {
        value = args[position - 1]
      } else if (typeof name === 'string') {
        value = args.reduce(Formatter.reduce(name), undefined)
      } else {
        value = args[i]
      }

      if (typeof formatter[type] === 'function') {
        value = formatter[type](value, options, locale)
      }

      result = result.replace(match, value)
    }

    return result
  }

  static reduce (name) {
    return (value, arg) => {
      return value === undefined
        ? get(arg, name)
        : value
    }
  }
}
