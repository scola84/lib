import { Action } from '../action'
import { Input } from '../input'

export class Validate extends Action {
  resolveInner (box, data) {
    for (let i = 0; i < this._args.length; i += 1) {
      this.resolveValidate(box, data, this._args[i])
    }
  }

  resolveValidate (box, data, snippet) {
    const snippets = snippet.find((s) => s instanceof Input)
    const error = {}

    for (let i = 0; i < snippets.length; i += 1) {
      snippets[i].resolveClean(box, data, error)
    }

    for (let i = 0; i < snippets.length; i += 1) {
      snippets[i].resolveValidate(box, data, error)
    }

    const hasError = Object.keys(error).length > 0

    if (hasError) {
      const newError = new Error('400 Input invalid')
      newError.data = error
      newError.original = data
      this.fail(box, newError)
    } else {
      this.pass(box, data)
    }
  }
}
