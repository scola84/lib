import { Checkbox } from './checkbox.js'

export class Radio extends Checkbox {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'radio'
    })
  }
}
