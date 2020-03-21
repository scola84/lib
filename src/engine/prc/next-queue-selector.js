import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../worker/api.js'

export class NextQueueSelector extends SqlBuilder {
  constructor (options = {}) {
    super(options)

    this._cleanup = null
    this.setCleanup(options.cleanup)
  }

  getCleanup () {
    return this._cleanup
  }

  setCleanup (value = 'P1W') {
    this._cleanup = value
  }

  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'queue.id_queue',
          'queue.stat_count_run_busy',
          'queue.stat_count_run_done',
          'queue.name',
          'queue.cleanup_after',
          'queue.previous_condition',
          'queue.trigger_condition',
          'queue.trigger_schedule',
          'queue.trigger_schedule_begin',
          'queue.trigger_schedule_end',
          'queue.trigger_selector_client',
          'queue.trigger_selector_query',
          'queue.trigger_time',
          'queue_run.stat_count_item_failure',
          'queue_run.stat_count_item_success',
          'queue_run.stat_count_item_timeout'
        )
      ),
      sc.from(
        sc.id('app.queue_run')
      ),
      sc.inner(),
      sc.join(
        sc.id('app.queue')
      ),
      sc.on(
        sc.eq(
          sc.id('queue_run.id_queue'),
          sc.id('queue.previous_id_queue')
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('queue_run.id_run'),
            sc.value((box, data) => data.id_run)
          ),
          sc.eq(
            sc.plus(
              sc.id('queue_run.stat_count_item_failure'),
              sc.id('queue_run.stat_count_item_success'),
              sc.id('queue_run.stat_count_item_timeout')
            ),
            sc.id('queue_run.stat_count_item_total')
          )
        )
      )
    )
  }

  decide (box, data) {
    return isFinite(data.id_run) === true
  }

  merge (box, data, { row: queue = {} }) {
    this.mergePrevious(data)
    this.mergeQueue(data, queue)
    this.mergeRun(data, queue)

    return data
  }

  mergePrevious (data) {
    data.previous = {
      id_run: data.id_run
    }

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
  }
}
