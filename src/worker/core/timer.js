import cron from 'node-cron'
import { Worker } from './worker'

export class Timer extends Worker {
  constructor (options = {}) {
    super(options)

    this._immediate = null
    this._interval = null
    this._schedule = null

    this.setImmediate(options.immediate)
    this.setInterval(options.interval)
    this.setSchedule(options.schedule)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      immediate: this._immediate,
      interval: this._interval,
      schedule: this._schedule
    })
  }

  getImmediate () {
    return this._immediate
  }

  setImmediate (value = false) {
    this._immediate = value
    return this
  }

  getInterval () {
    return this._interval
  }

  setInterval (value = null) {
    this._interval = value
    return this
  }

  getSchedule () {
    return this._schedule
  }

  setSchedule (value = null) {
    this._schedule = value
    return this
  }

  execute (box) {
    this.handle(
      box,
      this.filter(box)
    )
  }

  executeInterval () {
    const interval = typeof this._interval === 'number'
      ? ({ default: this._interval })
      : this._interval

    const names = Object.keys(interval)
    let name = null

    for (let i = 0; i < names.length; i += 1) {
      name = names[i]
      this.makeInterval(name, interval[name])
    }
  }

  executeSchedule () {
    const schedule = typeof this._schedule === 'string'
      ? ({ default: this._schedule })
      : this._schedule

    const names = Object.keys(schedule)
    let name = null

    for (let i = 0; i < names.length; i += 1) {
      name = names[i]
      this.makeSchedule(name, schedule[name])
    }
  }

  makeInterval (name, interval) {
    setInterval(() => {
      this.execute({
        interval: name
      })
    }, interval)
  }

  makeSchedule (name, schedule) {
    cron.schedule(schedule, () => {
      this.execute({
        schedule: name
      })
    })
  }

  start () {
    if (this._schedule !== null) {
      this.executeSchedule()
    }

    if (this._interval !== null) {
      this.executeInterval()
    }

    if (this._immediate) {
      this.execute({
        immediate: true
      })
    }
  }
}
