import * as d3 from 'd3-selection'
import isString from 'lodash/isString.js'
import { Event } from '../event.js'

export class Input extends Event {
  constructor (options) {
    super(options)

    this
      .name('input')
      .debounce(500)
  }

  handle (box, data, snippet, event) {
    const node = d3.select(event.srcElement)
    const minLength = node.attr('minlength')
    const value = node.property('value')

    if (isString(minLength) === true) {
      if (value.length >= parseFloat(minLength) || value.length === 0) {
        box.input = value
        this.pass(box, data)
      }
    } else {
      box.input = value
      this.pass(box, data)
    }
  }
}
