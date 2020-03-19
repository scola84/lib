import { SqlBuilder } from '../../worker/api.js'

export class QueueTriggerQueueSelector extends SqlBuilder {
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
          'trigger_cron_begin',
          'trigger_cron_end',
          'trigger_cron_expression',
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
              return this._regexp === null ? sc.id('name') : sc.value(this._regexp)
            }
          ),
          sc.lt(
            sc.id('trigger_time'),
            sc.value(() => this.date().toISO())
          ),
          sc.lt(
            sc.id('trigger_cron_begin'),
            sc.value(() => this.date().toISO())
          ),
          sc.gt(
            sc.id('trigger_cron_end'),
            sc.value(() => this.date().toISO())
          )
        )
      )
    )
  }

  filter () {
    return {}
  }

  merge (box, data, { row: queue }) {
    this.mergeQueue(data, queue)
    this.mergeRun(data, queue)
    return data
  }

  mergeQueue (data, queue = {}) {
    data.queue = queue
    return data
  }

  mergeRun (data, queue = {}) {
    data.run = {
      id_queue: queue.id_queue,
      cleanup_time: this
        .date()
        .plus(
          this.date(queue.cleanup_after || this._cleanup)
        )
        .toISO(),
      total: 0
    }

    return data
  }
}
