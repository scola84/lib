import { Action } from './action'

export class Widget extends Action {
  constructor (options = {}) {
    super(options)

    this._name = null
    this._widget = null

    this.setName(options.name)
    this.setWidget(options.widget)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      name: this._name,
      widget: this._widget
    }
  }

  getName () {
    return this._name
  }

  setName (...name) {
    this._name = name
    return this
  }

  name (...name) {
    return this.setName(...name)
  }

  getWidget () {
    return this._widget
  }

  setWidget (value = null) {
    this._widget = value
    return this
  }

  widget (value) {
    return this.setWidget(value)
  }

  createWidget () {
    const args = this._args
    this._args = []

    const widget = this.buildWidget(args)

    if (args.length > 0) {
      widget.setArgs(args)
    }

    this.setWidget(widget)
    this.append(widget)
  }

  resolve (box, data) {
    const isAllowed = this.isAllowed(box, data)

    if (isAllowed === false) {
      return null
    }

    if (this._widget === null) {
      this.createWidget()
    }

    return this.resolveBefore(box, data)
  }
}
