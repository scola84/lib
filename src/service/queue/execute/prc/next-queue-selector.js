import { SqlBuilder } from '../../../../worker/api.js'

export class NextQueueSelector extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.select(
        sb.id(
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
      sb.from(
        sb.id('app.queue_run')
      ),
      sb.inner(),
      sb.join(
        sb.id('app.queue')
      ),
      sb.on(
        sb.eq(
          sb.id('queue_run.id_queue'),
          sb.id('queue.trigger_id_queue')
        )
      ),
      sb.where(
        sb.and(
          sb.eq(
            sb.id('queue_run.id_run'),
            sb.value((box, data) => data.id_run)
          ),
          sb.eq(
            sb.plus(
              sb.id('queue_run.stat_count_failure'),
              sb.id('queue_run.stat_count_success'),
              sb.id('queue_run.stat_count_timeout')
            ),
            sb.id('queue_run.stat_count_total')
          )
        )
      )
    )
  }

  decide (box, data) {
    return typeof data.id_run === 'number'
  }

  merge (box, data, queue) {
    return {
      queue,
      previous: {
        id_run: data.id_run
      }
    }
  }
}
