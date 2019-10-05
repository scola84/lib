import { select } from 'd3-selection'
import { Event } from '../event'

export class Input extends Event {
  constructor (options) {
    super(options)

    this
      .name('input')
      .debounce(500)
  }

  handle (box, data, snippet, event) {
    const node = select(event.srcElement)
    const minLength = node.attr('minlength')
    const value = node.property('value')

    if (minLength !== undefined) {
      if (value.length >= minLength || value.length === 0) {
        box.input = value
        this.pass(box, data)
      }
    } else {
      box.input = value
      this.pass(box, data)
    }
  }
}
