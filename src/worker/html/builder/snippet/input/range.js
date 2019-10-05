import { Number } from './number'

export class Range extends Number {
  constructor (options) {
    super(options)

    this.attributes({
      type: 'range'
    })
  }
}
