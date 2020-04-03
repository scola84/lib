import { SqlBuilder } from '../../actor/api.js'

export class QueueSelector extends SqlBuilder {
  constructor (options = {}) {
    super(options)

    this._cleanup = null
    this._regexp = null

    this.setCleanup(options.cleanup)
    this.setRegexp(options.regexp)
  }

  getCleanup () {
    return this._cleanup
  }

  setCleanup (value = 'P1W') {
    this._cleanup = value
  }

  getRegexp () {
    return this._regexp
  }

  setRegexp (value = null) {
    this._regexp = value
    return this
  }

  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'id_queue',
          'stat_count_run_busy',
          'stat_count_run_done',
          'cleanup_after',
          'name',
          'trigger_condition',
          'trigger_schedule',
          'trigger_schedule_begin',
          'trigger_schedule_end',
          'trigger_selector_client',
          'trigger_selector_query'
        )
      ),
      sc.from(
        sc.id('app.queue')
      ),
      sc.where(
        sc.and(
          sc.regexp(
            sc.id('name'),
            () => {
              return this._regexp === null
                ? sc.id('name')
                : sc.value(this._regexp)
            }
          ),
          sc.lt(
            sc.id('trigger_time'),
            sc.now()
          ),
          sc.lt(
            sc.id('trigger_schedule_begin'),
            sc.now()
          ),
          sc.gt(
            sc.id('trigger_schedule_end'),
            sc.now()
          )
        )
      )
    )
  }

  filter () {
    return {}
  }

  merge (box, data, { row: queue = {} }) {
    this.mergeQueue(data, queue)
    this.mergeRun(data, queue)

    return data
  }

  mergeQueue (data, queue) {
    data.queue = queue

    data.queue.cleanup_time = this
      .transformDate(queue.cleanup_after || this._cleanup)
      .toISOString()

    return data
  }

  mergeRun (data, queue) {
    data.run = {
      id_queue: queue.id_queue,
      total: 0
    }

    return data
  }
}
