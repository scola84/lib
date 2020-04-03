import { SqlBuilder } from '../../actor/api.js'

export class TimeoutTaskSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'id_item',
          'id_queue',
          'id_run',
          'id_task'
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

  merge (box, data, { row }) {
    return {
      out: {
        ...row,
        final: true
      }
    }
  }
}
