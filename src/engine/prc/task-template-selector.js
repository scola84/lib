import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../worker/api.js'

export class TaskTemplateSelector extends SqlBuilder {
  constructor (options = {}) {
    super(options)

    this._timeout = null
    this.setTimeout(options.timeout)
  }

  getTimeout () {
    return this._timeout
  }

  setTimeout (value = 'P1W') {
    this._timeout = value
    return this
  }

  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'settings',
          'timeout_after'
        )
      ),
      sc.from(
        sc.id('app.queue_task_template')
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_queue'),
            sc.value((box, data) => data.id_queue)
          ),
          sc.eq(
            sc.id('name'),
            sc.value((box, data) => data.name)
          )
        )
      )
    )
  }

  decide (box, data) {
    return isFinite(data.id_queue) === true
  }

  merge (box, data, { rows: [template] }) {
    this.mergeSettings(data, template)
    this.mergeTimeout(data, template)
    return data
  }

  mergeSettings (data, template = {}) {
    data.settings = JSON.parse(template.settings || '{}')
    return data
  }

  mergeTimeout (data, template = {}) {
    data.timeout_time = this
      .date()
      .plus(
        this.date(template.timeout_after || this._timeout)
      )
      .toISO()

    return data
  }
}
