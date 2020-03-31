import { DateTime } from './datetime.js'

export class Month extends DateTime {
  constructor (options) {
    super(options)

    this
      .attributes({
        type: 'month'
      })
      .formatFrom('yyyy-MM')
      .formatTo('MMM yyyy')
  }
}
