import { event, select } from 'd3-selection'
import { Node } from '../node'

export class Button extends Node {
  constructor (options = {}) {
    super(options)

    this._form = null
    this._menu = null

    this.setForm(options.form)
    this.setMenu(options.menu)

    this
      .attributes({
        type: 'button'
      })
      .classed({
        click: true
      })
      .name('button')
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      form: this._form,
      menu: this._menu
    })
  }

  getForm () {
    return this._form
  }

  setForm (value = null) {
    this._form = value
    return this
  }

  form (value) {
    return this.setForm(value)
  }

  getMenu () {
    return this._menu
  }

  setMenu (value = false) {
    this._menu = value
    return this
  }

  menu () {
    return this.setMenu(true)
  }

  removeBefore () {
    if (this._node) {
      this._node.on('.scola-button', null)
    }

    this.removeOuter()
  }

  resolveAfter (box, data) {
    if (this._form) {
      return this.resolveForm(box, data)
    }

    if (this._menu) {
      return this.resolveMenu(box, data)
    }

    return this._node
  }

  resolveForm () {
    this._node
      .attr('type', 'submit')
      .attr('form', this._form)

    this._node.on('click.scola-button', () => {
      event.preventDefault()

      select('#' + this._form).dispatch('submit', {
        cancelable: true
      })
    })

    return this._node
  }

  resolveMenu (box) {
    if (box.options.mem === false && box.options.his === false) {
      this._node
        .attr('class', null)
        .classed('button icon show-menu ion-ios-menu', true)
        .text(null)
    }

    return this._node
  }
}
