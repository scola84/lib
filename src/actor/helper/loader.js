export class Loader {
  constructor (options = {}) {
    this._modules = null
    this.setModules(options.modules)
  }

  getModules () {
    return this._modules
  }

  setModules (value = {}) {
    this._modules = value
    return this
  }

  getModule (name) {
    return this._modules[name]
  }

  newModule (name, ...args) {
    return new this._modules[name](...args)
  }
}
