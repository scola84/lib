import { SqlBuilder } from '../../worker/api.js'

export class TimeoutTriggerTaskSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'id_item',
          'id_queue',
          'id_run',
          'id_task'
        ),
        sc.as(
          sc.value('TIMEOUT'),
          sc.id('status')
        )
      ),
      sc.from(
        sc.id('app.queue_task')
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('status'),
            sc.value('PENDING')
          ),
          sc.lt(
            sc.id('timeout_time'),
            sc.now()
          )
        )
      )
    )
  }
}
