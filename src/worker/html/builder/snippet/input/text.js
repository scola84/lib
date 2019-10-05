import { Input } from '../input'

export class Text extends Input {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'text'
    })
  }

  cleanAfter (box, data, name, value) {
    this.setValue(data, name, String(value).trim())
  }
}
