import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../ops/api.js'

export class TaskMerger extends SqlBuilder {
  constructor (options = {}) {
    super(options)

    this._cleanup = null
    this._timeout = null

    this.setCleanup(options.cleanup)
    this.setTimeout(options.timeout)
  }

  getCleanup () {
    return this._cleanup
  }

  setCleanup (value = 'P1W') {
    this._cleanup = value
  }

  getTimeout () {
    return this._timeout
  }

  setTimeout (value = 'P3D') {
    this._timeout = value
    return this
  }

  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'queue.cleanup_after',
          'queue_task_control.settings',
          'queue_task_control.timeout_after'
        )
      ),
      sc.from(
        sc.id('app.queue')
      ),
      sc.left(),
      sc.join(
        sc.id('app.queue_task_control')
      ),
      sc.on(
        sc.and(
          sc.eq(
            sc.id('queue.id_queue'),
            sc.id('queue_task_control.id_queue')
          ),
          sc.eq(
            sc.id('queue_task_control.name'),
            sc.value((box, data) => data.name)
          )
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('queue.id_queue'),
            sc.value((box, data) => data.id_queue)
          )
        )
      )
    )
  }

  decide (box, data) {
    return isFinite(data.id_queue) === true
  }

  merge (box, data, { rows: [control] }) {
    this.mergeSettings(data, control)
    this.mergeCleanup(data, control)
    this.mergeTimeout(data, control)

    return data
  }

  mergeSettings (data, control = {}) {
    data.settings = JSON.parse(control.settings || '{}')
    return data
  }

  mergeCleanup (data, control = {}) {
    data.cleanup_time = this
      .transformDate(control.cleanup_after || this._cleanup)
      .toISOString()

    return data
  }

  mergeTimeout (data, control = {}) {
    data.timeout_time = this
      .transformDate(control.timeout_after || this._timeout)
      .toISOString()

    return data
  }
}
