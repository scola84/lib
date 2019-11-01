import { Worker } from './worker'
import * as formatter from './builder/helper/formatter'

export class Builder extends Worker {
  static attachFactories (target, objects) {
    const groups = Object.keys(objects)

    let group = null
    let names = null

    for (let i = 0; i < groups.length; i += 1) {
      group = groups[i]
      names = Object.keys(objects[group])

      for (let j = 0; j < names.length; j += 1) {
        Builder.attachFactory(target, objects, group, names[j])
      }
    }
  }

  static attachFactory (target, objects, group, name) {
    const {
      object: O,
      options
    } = objects[group][name]

    const safeName = target.prototype[name] === undefined
      ? name
      : group + name

    target.prototype[safeName] = function create (...args) {
      return new O({
        args,
        builder: this,
        ...options
      })
    }
  }

  format (string, args, locale) {
    const reductor = (k) => (a, v = {}) => (a === undefined ? v[k] : a)
    const regexpBase = '%((\\((\\w+)\\))?((\\d+)\\$)?)([lmns])(\\[(.+)\\])?'

    const regexpGlobal = new RegExp(regexpBase, 'g')
    const regexpSingle = new RegExp(regexpBase)

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
      } else if (formatter[type] !== undefined) {
        value = formatter[type](value, options, locale)
      }

      result = result.replace(match, value)
    }

    return result
  }
}

Builder.formatter = formatter
