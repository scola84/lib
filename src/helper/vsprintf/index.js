import { l } from './luxon'
import { m } from './marked'
import { n } from './number'
import { s } from './string'

const formatters = {
  l,
  m,
  n,
  s
}

const regexpBase = '%((\\((\\w+)\\))?((\\d+)\\$)?)([lmns])(\\[(.+)\\])?'
const regexpGlobal = new RegExp(regexpBase, 'g')
const regexpSingle = new RegExp(regexpBase)
const reductor = (k) => (a, v = {}) => { return a === undefined ? v[k] : a }

export function vsprintf (format, args, locale) {
  const matches = format.match(regexpGlobal) || []

  let match = null
  let name = null
  let options = null
  let position = null
  let result = format
  let type = null
  let value = null

  for (let i = 0; i < matches.length; i += 1) {
    [
      match, , , name, , position, type, , options
    ] = matches[i].match(regexpSingle)

    if (position !== undefined) {
      value = args[position - 1]
    } else if (name !== undefined) {
      value = args.reduce(reductor(name), undefined)
    } else {
      value = args[i]
    }

    if (value === null || value === undefined) {
      value = ''
    } else if (formatters[type] !== undefined) {
      value = formatters[type](value, options, locale)
    }

    result = result.replace(match, value)
  }

  return result
}

Object.assign(vsprintf, formatters)
