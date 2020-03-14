import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../../../worker/api.js'

export class NextQueueSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'queue.id_queue',
          'queue.name',
          'queue.selector_client',
          'queue.selector_query',
          'queue.trigger_schedule',
          'queue.trigger_schedule_begin',
          'queue.trigger_schedule_end',
          'queue.trigger_schedule_next'
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
          sc.id('queue.trigger_id_queue')
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
              sc.id('queue_run.stat_count_failure'),
              sc.id('queue_run.stat_count_success'),
              sc.id('queue_run.stat_count_timeout')
            ),
            sc.id('queue_run.stat_count_total')
          )
        )
      )
    )
  }

  decide (box, data) {
    return isFinite(data.id_run) === true
  }

  merge (box, data, { row: queue }) {
    return {
      queue,
      previous: {
        id_run: data.id_run
      }
    }
  }
}
