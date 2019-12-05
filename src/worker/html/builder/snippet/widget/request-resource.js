import { Widget } from '../widget'

let wlevel = ''
let wprefix = 'api'
let wversion = ''

export class RequestResource extends Widget {
  static getLevel () {
    return wlevel
  }

  static setLevel (value) {
    wlevel = value
    return wlevel
  }

  static getPrefix () {
    return wprefix
  }

  static setPrefix (value) {
    wprefix = value
    return wprefix
  }

  static getVersion () {
    return wversion
  }

  static setVersion (value) {
    wversion = value
    return wversion
  }

  constructor (options = {}) {
    super(options)

    this._level = null
    this._prefix = null
    this._version = null

    this.setLevel(options.level)
    this.setPrefix(options.prefix)
    this.setVersion(options.version)
  }

  getLevel () {
    return this._level
  }

  setLevel (value = wlevel) {
    this._level = value
    return this
  }

  level (value) {
    return this.setLevel(value)
  }

  getPrefix () {
    return this._prefix
  }

  setPrefix (value = wprefix) {
    this._prefix = value
    return this
  }

  prefix (value) {
    return this.setPrefix(value)
  }

  getVersion () {
    return this._version
  }

  setVersion (value = wversion) {
    this._version = value
    return this
  }

  version (value) {
    return this.setVersion(value)
  }
}
