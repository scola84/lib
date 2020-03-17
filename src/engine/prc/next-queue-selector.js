import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../worker/api.js'

export class NextQueueSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'queue.id_queue',
          'queue.stat_count_run_busy',
          'queue.stat_count_run_done',
          'queue.name',
          'queue.previous_condition',
          'queue.trigger_condition',
          'queue.trigger_cron_expression',
          'queue.trigger_cron_begin',
          'queue.trigger_cron_end',
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
    return isFinite(data.id_run)
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
