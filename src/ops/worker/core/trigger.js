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
    if (this._interval !== null) {
      this.log('info', 'Setting interval to %o', [value])
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

  setModules (value = { cron }) {
    return super.setModules(value)
  }

  getSchedule () {
    return this._schedule
  }

  setSchedule (value = null) {
    if (this._schedule !== null) {
      this.log('info', 'Setting schedule to %o', [value])
      this._schedule.stop()
    }

    if (value === null) {
      this._schedule = null
      return this
    }

    this._schedule = this._modules.cron.schedule(value, () => {
      this.call()
    })

    return this
  }
}
