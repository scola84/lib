import { Worker } from './worker'

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
    const { object: O, options } = objects[group][name]

    if (target.prototype[name]) {
      name = group + name
    }

    target.prototype[name] = function create (...args) {
      return new O(Object.assign({
        args,
        builder: this
      }, options))
    }
  }
}
