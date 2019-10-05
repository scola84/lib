import { Checkbox } from './checkbox'

export class Radio extends Checkbox {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'radio'
    })
  }
}
