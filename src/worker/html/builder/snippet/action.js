import { Snippet } from './snippet'

export class Action extends Snippet {
  constructor (options = {}) {
    super(options)

    this._act = null
    this._err = null

    this.setAct(options.act)
    this.setErr(options.err)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      act: this._act,
      err: this._err
    }
  }

  getAct () {
    return this._act
  }

  setAct (value = []) {
    this._act = value
    return this
  }

  act (...args) {
    return this.setAct(args)
  }

  getErr () {
    return this._err
  }

  setErr (value = []) {
    this._err = value
    return this
  }

  err (...args) {
    return this.setErr(args)
  }

  expand (string) {
    let expandedString = string
    const matches = expandedString.match(/\{.+\}/g)

    if (matches === null) {
      return expandedString
    }

    let names = null
    let match = null

    for (let i = 0; i < matches.length; i += 1) {
      match = matches[i]

      names = match
        .slice(1, -1)
        .split(',')
        .map((name) => `${name}=%(${name})s`)
        .join('&')

      expandedString = expandedString.replace(match, names)
    }

    return expandedString
  }

  fail (box, error) {
    for (let i = 0; i < this._err.length; i += 1) {
      this.resolveValue(box, error, this._err[i])
    }
  }

  pass (box, data) {
    for (let i = 0; i < this._act.length; i += 1) {
      this.resolveValue(box, data, this._act[i])
    }
  }
}
