import cron from 'node-cron'
import { Worker } from './worker.js'

export class Trigger extends Worker {
  constructor (options = {}) {
    super(options)

    this._interval = null
    this._schedule = null

    this.setInterval(options.interval)
    this.setSchedule(options.schedule)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      interval: this._interval,
      schedule: this._schedule
    }
  }

  getInterval () {
    return this._interval
  }

  setInterval (value = null) {
    this.log('info', 'Setting interval to %o', [value])

    if (this._interval !== null) {
      clearInterval(this._interval)
    }

    if (value === null) {
      this._interval = null
      return this
    }

    this._interval = setInterval(() => {
      this.call()
    }, value)

    return this
  }

  getSchedule () {
    return this._schedule
  }

  setSchedule (value = null) {
    this.log('info', 'Setting schedule to %o', [value])

    if (this._schedule !== null) {
      this._schedule.stop()
    }

    if (value === null) {
      this._schedule = null
      return this
    }

    this._schedule = cron.schedule(value, () => {
      this.call()
    })

    return this
  }
}
