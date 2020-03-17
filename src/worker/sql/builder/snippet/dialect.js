import isFunction from 'lodash/isFunction.js'
import isNil from 'lodash/isNil.js'
import { Snippet } from './snippet.js'

export class Dialect extends Snippet {
  merge (box, data, result) {
    return this.mergeInner(box, data,
      this[`merge${this._origin.constructor.name}`](box, data, result))
  }

  mergeMysql (box, data, result) {
    return result
  }

  mergePostgresql (box, data, result) {
    return result
  }

  resolveFunction (name, box, data, value) {
    return this[`${name}${this._origin.constructor.name}`](box, data, value)
  }

  resolveInfix (box, data) {
    return this.resolveFunction('resolveInfix', box, data)
  }

  resolveInfixMysql () {
    return this._infix
  }

  resolveInfixPostgresql () {
    return this._infix
  }

  resolveValue (box, data, value) {
    if (isNil(value) === true) {
      return 'NULL'
    }

    if ((value instanceof Snippet) === true) {
      return this.resolveValue(box, data, value.resolve(box, data))
    }

    if (isFunction(value) === true) {
      return this.resolveValue(box, data, value(box, data))
    }

    return this.resolveFunction('resolveValue', box, data, value)
  }

  resolveValueMysql (box, data, value) {
    return value
  }

  resolveValuePostgresql (box, data, value) {
    return value
  }

  resolvePostfix (box, data) {
    return this.resolveFunction('resolvePostfix', box, data)
  }

  resolvePostfixMysql () {
    return this._postfix
  }

  resolvePostfixPostgresql () {
    return this._postfix
  }

  resolvePrefix (box, data) {
    return this.resolveFunction('resolvePrefix', box, data)
  }

  resolvePrefixMysql () {
    return this._prefix
  }

  resolvePrefixPostgresql () {
    return this._prefix
  }
}
