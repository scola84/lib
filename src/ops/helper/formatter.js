import get from 'lodash/get.js'
import isString from 'lodash/isString.js'
import isUndefined from 'lodash/isUndefined.js'
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

      if (isString(position) === true) {
        value = args[position - 1]
      } else if (isString(name) === true) {
        value = args.reduce(Formatter.reducer(name), undefined)
      } else {
        value = args[i]
      }

      result = result.replace(
        match,
        formatter[type].format(value, options, locale)
      )
    }

    return result
  }

  static reducer (name) {
    return (value, arg) => {
      return isUndefined(value) === true
        ? get(arg, name)
        : value
    }
  }
}
