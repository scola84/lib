import { SqlSnippet } from '../snippet.js'

export class EqNull extends SqlSnippet {
  resolveInner (box, data) {
    const left = this.resolveValue(box, data, this._args[0])
    const right = this.resolveValue(box, data, this._args[1])

    if (right === 'NULL') {
      return this.concat(this.concat(left, ' IS '), right)
    }

    return this.concat(this.concat(left, ' = '), right)
  }
}
