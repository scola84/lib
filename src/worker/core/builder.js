import { Worker } from './worker.js'

export class Builder extends Worker {
  static attachFactories (objects) {
    const groups = Object.keys(objects)

    let group = null
    let names = null

    for (let i = 0; i < groups.length; i += 1) {
      group = groups[i]
      names = Object.keys(objects[group])

      for (let j = 0; j < names.length; j += 1) {
        Reflect.apply(Builder.attachFactory, this,
          [objects[group][names[j]], group, names[j]])
      }
    }
  }

  static attachFactory (object, group, name, safe = false) {
    const {
      object: O,
      options
    } = object

    const safeName = safe === false && this.prototype[name] === undefined
      ? name
      : group + name

    this.prototype[safeName] = function create (...args) {
      return new O({
        args,
        origin: this,
        ...options
      })
    }
  }
}
