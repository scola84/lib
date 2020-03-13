import { SqlBuilder } from '../../../../worker/api.js'

export class TriggerQueueSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
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
      sc.from(
        sc.id('app.queue')
      )
      // ,
      // sc.where(
      //   sc.and(
      //     sc.lt(
      //       sc.id('trigger_schedule_next'),
      //       sc.value(() => new Date().toISOString())
      //     ),
      //     sc.lt(
      //       sc.id('trigger_schedule_begin'),
      //       sc.value(() => new Date().toISOString())
      //     ),
      //     sc.gt(
      //       sc.id('trigger_schedule_end'),
      //       sc.value(() => new Date().toISOString())
      //     )
      //   )
      // )
    )
  }

  merge (box, data, { row: queue }) {
    return {
      queue
    }
  }
}
