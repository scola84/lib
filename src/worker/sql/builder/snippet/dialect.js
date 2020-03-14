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

  resolveValue (box, data, value) {
    if (isString(value) === false) {
      return this[`resolve${this._origin.constructor.name}`](box, data, value)
    }

    return super.resolveValue(box, data, value)
  }

  resolveMysql (box, data, value) {
    return value
  }

  resolvePostgresql (box, data, value) {
    return value
  }
}
