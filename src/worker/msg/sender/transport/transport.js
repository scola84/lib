export class Transport {
  constructor (options = {}) {
    this._builder = null
    this._options = null

    this.setBuilder(options.builder)
    this.setOptions(options.options)
  }

  getBuilder () {
    return this._builder
  }

  setBuilder (value = null) {
    this._builder = value
    return this
  }

  builder (value) {
    return this.setBuilder(value)
  }

  getOptions () {
    return this._options
  }

  setOptions (value = {}) {
    this._options = value
    return this
  }

  options (value) {
    return this.setOptions(value)
  }

  send () {}
}
