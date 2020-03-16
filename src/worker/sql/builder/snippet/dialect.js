import isString from 'lodash/isString.js'
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

  resolveDialect (name, box, data, value) {
    return this[`${name}${this._origin.constructor.name}`](box, data, value)
  }

  resolveInfix (box, data) {
    return this.resolveDialect('resolveInfix', box, data)
  }

  resolveInfixMysql () {
    return this._infix
  }

  resolveInfixPostgresql () {
    return this._infix
  }

  resolveValue (box, data, value) {
    if (isString(value) === true) {
      return this.resolveDialect('resolveValue', box, data, value)
    }

    return super.resolveValue(box, data, value)
  }

  resolveValueMysql (box, data, value) {
    return value
  }

  resolveValuePostgresql (box, data, value) {
    return value
  }

  resolvePostfix (box, data) {
    return this.resolveDialect('resolvePostfix', box, data)
  }

  resolvePostfixMysql () {
    return this._postfix
  }

  resolvePostfixPostgresql () {
    return this._postfix
  }

  resolvePrefix (box, data) {
    return this.resolveDialect('resolvePrefix', box, data)
  }

  resolvePrefixMysql () {
    return this._prefix
  }

  resolvePrefixPostgresql () {
    return this._prefix
  }
}
