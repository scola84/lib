import { SqlBuilder } from '../../worker/api.js'

export class QueueStatBeforeUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_queue_updated'),
          sc.value(() => this.date().toISO())
        ),
        sc.eq(
          sc.id('stat_count_run_busy'),
          sc.plus(
            sc.id('stat_count_run_busy'),
            sc.value(1)
          )
        )
      ),
      sc.where(
        sc.eq(
          sc.id('id_queue'),
          sc.value((box, data) => data.queue.id_queue)
        )
      )
    )
  }

  decide (box, data) {
    return data.first === true
  }
}
