import { Event } from '../event'

export class Submit extends Event {
  constructor (options) {
    super(options)
    this.name('submit')
  }

  handle (box, data, snippet) {
    data = {}

    const formData = new window.FormData(snippet.node().node())
    const keys = Array.from(formData.keys())

    let key = null
    let value = null

    for (let i = 0; i < keys.length; i += 1) {
      key = keys[i]

      value = formData.getAll(key)
      value = value.length === 1 ? value[0] : value

      data[key] = value
    }

    this.pass(box, data)
  }
}
