import { SqlBuilder } from '../../../../worker/api.js'

export class TriggerQueueSelector extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.select(
        sb.id(
          'id_queue',
          'name',
          'selector_client',
          'selector_query',
          'trigger_schedule',
          'trigger_schedule_begin',
          'trigger_schedule_end',
          'trigger_schedule_next'
        )
      ),
      sb.from(
        sb.id('app.queue')
      )
      // ,
      // sb.where(
      //   sb.and(
      //     sb.lt(
      //       sb.id('trigger_schedule_next'),
      //       sb.value(() => new Date().toISOString())
      //     ),
      //     sb.lt(
      //       sb.id('trigger_schedule_begin'),
      //       sb.value(() => new Date().toISOString())
      //     ),
      //     sb.gt(
      //       sb.id('trigger_schedule_end'),
      //       sb.value(() => new Date().toISOString())
      //     )
      //   )
      // )
    )
  }

  merge (box, data, queue) {
    return {
      queue
    }
  }
}
