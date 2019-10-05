import set from 'lodash-es/set'
import { Node } from './node'

export class Input extends Node {
  constructor (options = {}) {
    super(options)

    this._clean = null
    this._default = null
    this._validate = null
    this._wrap = null

    this.setClean(options.clean)
    this.setDefault(options.default)
    this.setValidate(options.validate)
    this.setWrap(options.wrap)

    this.name('input')
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      clean: this._clean,
      default: this._default,
      validate: this._validate,
      wrap: this._wrap
    })
  }

  getClean () {
    return this._clean
  }

  setClean (value = (box, data, val) => val) {
    this._clean = value
    return this
  }

  clean (value) {
    return this.setClean(value)
  }

  getDefault () {
    return this._default
  }

  setDefault (value = null) {
    this._default = value
    return this
  }

  default (value) {
    return this.setDefault(value)
  }

  getValidate () {
    return this._validate
  }

  setValidate (value = () => true) {
    this._validate = value
    return this
  }

  validate (value) {
    return this.setValidate(value)
  }

  getWrap () {
    return this._wrap
  }

  setWrap (value = false) {
    this._wrap = value
    return this
  }

  wrap () {
    return this.setWrap(true)
  }

  cleanAfter () {}

  cleanBefore (box, data, name, value) {
    this.cleanInput(box, data, name, value)
  }

  cleanInput (box, data, name, value) {
    const isAllowed = this.isAllowed(box, data)

    if (isAllowed === false) {
      value = ''
      this.setValue(data, name, value)
    }

    const isEmpty = this.isEmpty(value)

    if (isEmpty === true) {
      if (this._default === null) {
        this.setValue(data, name, null)
        return
      }

      value = this.resolveValue(box, data, this._default)
      this.setValue(data, name, value)
    }

    value = this._clean(box, data, value)
    this.setValue(data, name, value)

    this.cleanAfter(box, data, name, value)
  }

  createNode () {
    super.createNode()

    if (this._wrap) {
      this.wrapInput()
    }
  }

  isAboveMin (value, min) {
    if (min === null) {
      return true
    }

    return value >= parseFloat(min)
  }

  isBelowMax (value, max) {
    if (max === null) {
      return true
    }

    return value <= parseFloat(max)
  }

  isDefined (value, required) {
    if (required === null) {
      return true
    }

    return this.isEmpty(value) === false
  }

  isEmpty (value) {
    return value === undefined ||
      value === null ||
      value === ''
  }

  isMultiple (value, multiple) {
    if (multiple === null) {
      return true
    }

    return Array.isArray(value) === true
  }

  resolveClean (box, data) {
    const name = this.resolveAttribute(box, data, 'name')
    const value = data[name]

    if (Array.isArray(value) === false) {
      this.cleanBefore(box, data, name, value)
      return
    }

    for (let i = 0; i < value.length; i += 1) {
      this.cleanBefore(box, data, `${name}.${i}`, value[i])
    }
  }

  resolveValidate (box, data, error) {
    const name = this.resolveAttribute(box, data, 'name')
    const value = data[name]

    const multiple = this.resolveAttribute(box, data, 'multiple')

    if (this.isMultiple(value, multiple) === false) {
      return this.setError(error, name, value, 'array')
    }

    if (Array.isArray(value) === false) {
      return this.validateBefore(box, data, error, name, value)
    }

    for (let i = 0; i < value.length; i += 1) {
      this.validateBefore(box, data, error, `${name}.${i}`, value[i])
    }

    return null
  }

  setError (error, name, value, reason, options = {}) {
    value = Object.assign({}, options, {
      reason,
      type: this.constructor.name.toLowerCase(),
      value
    })

    this.setValue(error, name, value)
  }

  setValue (object, key, value) {
    set(object, key, value)
  }

  validateAfter () {}

  validateBefore (box, data, error, name, value) {
    return this.validateInput(box, data, error, name, value)
  }

  validateInput (box, data, error, name, value) {
    const required = this.resolveAttribute(box, data, 'required')

    if (this.isDefined(value, required) === false) {
      return this.setError(error, name, value, 'required')
    }

    if (this.isEmpty(value) === true) {
      return null
    }

    const maxlength = this.resolveAttribute(box, data, 'maxlength')

    if (this.isBelowMax(String(value).length, maxlength) === false) {
      return this.setError(error, name, value, 'maxlength', { maxlength })
    }

    const max = this.resolveAttribute(box, data, 'max')

    if (this.isBelowMax(value, max) === false) {
      return this.setError(error, name, value, 'max', { max })
    }

    const min = this.resolveAttribute(box, data, 'min')

    if (this.isAboveMin(value, min) === false) {
      return this.setError(error, name, value, 'min', { min })
    }

    if (this._validate(box, data, value) === false) {
      return this.setError(error, name, value, 'custom')
    }

    return this.validateAfter(box, data, error, name, value)
  }

  wrapInput () {}
}
