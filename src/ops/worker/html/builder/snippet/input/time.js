import { DateTime } from './datetime.js'

export class Time extends DateTime {
  constructor (options) {
    super(options)

    this
      .attributes({
        type: 'time'
      })
      .formatFrom('HH:mm')
      .formatTo('t')
  }
}
