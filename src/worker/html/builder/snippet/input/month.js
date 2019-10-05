import { DateTime } from './datetime'

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
