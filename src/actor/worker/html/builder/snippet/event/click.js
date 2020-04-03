import { Event } from '../event.js'

export class Click extends Event {
  constructor (options) {
    super(options)
    this.name('click')
  }

  handle (box, data, snippet, event) {
    if (event.target.closest('.click') !== null) {
      this.pass(box, data)
    }
  }
}
