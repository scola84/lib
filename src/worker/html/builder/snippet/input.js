import isArray from 'lodash/isArray.js'
import isNil from 'lodash/isNil.js'
import set from 'lodash/set.js'
import { Node } from './node.js'

export class Input extends Node {
  constructor (options = {}) {
    super(options)

    this._clean = null
    this._default = null
    this._strict = null
    this._validate = null
    this._wrap = null

    this.setClean(options.clean)
    this.setDefault(options.default)
    this.setStrict(options.strict)
    this.setValidate(options.validate)
    this.setWrap(options.wrap)

    this.name('input')
  }

  getOptions () {
    return {
      ...super.getOptions(),
      clean: this._clean,
      default: this._default,
      strict: this._strict,
      validate: this._validate,
      wrap: this._wrap
    }
  }

  getClean () {
    return this._clean
  }

  setClean (value = (b, d, v) => v) {
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

  getStrict () {
    return this._strict
  }

  setStrict (value = true) {
    this._strict = value
    return this
  }

  strict (value) {
    return this.setStrict(value)
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
    let cleanValue = value

    const hasPermission = this.hasPermission(box, data)

    if (hasPermission === false) {
      cleanValue = ''
      this.setValue(data, name, cleanValue)
    }

    if (cleanValue === '' || isNil(cleanValue) === true) {
      if (this._default === null) {
        this.setValue(data, name, null)
        return
      }

      cleanValue = this.resolveValue(box, data, this._default)
      this.setValue(data, name, cleanValue)
    }

    cleanValue = this._clean(box, data, cleanValue)
    this.setValue(data, name, cleanValue)

    this.cleanAfter(box, data, name, cleanValue)
  }

  createNode () {
    super.createNode()

    if (this._wrap === true) {
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

  isMultiple (value, multiple) {
    if (multiple === null) {
      return true
    }

    return isArray(value) === true
  }

  resolveClean (box, data) {
    const name = this.resolveAttribute(box, data, 'name')
    const value = data[name]

    if (isArray(value) === false) {
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

    if (isArray(value) === false) {
      return this.validateBefore(box, data, error, name, value)
    }

    for (let i = 0; i < value.length; i += 1) {
      this.validateBefore(box, data, error, `${name}.${i}`, value[i])
    }

    return null
  }

  setError (error, name, value, reason, options = {}) {
    this.setValue(error, name, {
      ...options,
      reason,
      type: this.constructor.name.toLowerCase(),
      value
    })
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

    if (value === '' || isNil(value) === true) {
      if (required === true) {
        return this.setError(error, name, value, 'required')
      }

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
