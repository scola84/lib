import { SqlBuilder } from '../../worker/api.js'

export class QueueTriggerQueueSelector extends SqlBuilder {
  constructor (options = {}) {
    super(options)

    this._regexp = null
    this.setRegexp(options.regexp)
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
          'queue.id_queue',
          'queue.stat_count_run_busy',
          'queue.stat_count_run_done',
          'queue.name',
          'queue.trigger_condition',
          'queue.trigger_cron_begin',
          'queue.trigger_cron_end',
          'queue.trigger_cron_expression',
          'queue.trigger_selector_client',
          'queue.trigger_selector_query'
        )
      ),
      sc.from(
        sc.id('app.queue')
      ),
      sc.where(
        sc.and(
          sc.regexp(
            sc.id('name'),
            this._regexp === null ? sc.id('name') : sc.value(this._regexp)
          )
          //     sc.lt(
          //       sc.id('trigger_time'),
          //       sc.value(() => new Date().toISOString())
          //     ),
          //     sc.lt(
          //       sc.id('trigger_cron_begin'),
          //       sc.value(() => new Date().toISOString())
          //     ),
          //     sc.gt(
          //       sc.id('trigger_cron_end'),
          //       sc.value(() => new Date().toISOString())
          //     )
        )
      )
    )
  }

  merge (box, data, { row: queue }) {
    return {
      queue
    }
  }
}
