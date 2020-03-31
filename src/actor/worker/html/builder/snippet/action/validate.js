import { Action } from '../action.js'
import { Input } from '../input.js'

export class Validate extends Action {
  resolveInner (box, data) {
    for (let i = 0; i < this._args.length; i += 1) {
      this.resolveValidate(box, data, this._args[i])
    }
  }

  resolveValidate (box, data, snippet) {
    const snippets = snippet.find((s) => (s instanceof Input) === true)
    const error = {}

    for (let i = 0; i < snippets.length; i += 1) {
      snippets[i].resolveClean(box, data, error)
    }

    for (let i = 0; i < snippets.length; i += 1) {
      snippets[i].resolveValidate(box, data, error)
    }

    if (Object.keys(error).length === 0) {
      this.pass(box, data)
      return
    }

    const failError = new Error('400 [validate] Input is invalid')
    failError.data = error

    this.fail(box, failError)
  }
}
