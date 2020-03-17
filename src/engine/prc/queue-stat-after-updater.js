import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../worker/api.js'

export class QueueStatAfterUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.with(
        sc.as(
          sc.id('queue_run'),
          sc.query(
            sc.select(
              sc.as(
                sc.string(
                  sc.case(),
                  sc.when(
                    sc.eq(
                      sc.id('queue_run.stat_time_item_last'),
                      sc.value(null)
                    )
                  ),
                  sc.then(0),
                  sc.else(1),
                  sc.end()
                ),
                sc.id('status_bit')
              )
            ),
            sc.from(
              sc.id('app.queue_run')
            ),
            sc.where(
              sc.eq(
                sc.id('queue_run.id_run'),
                sc.value((box, data) => data.id_run)
              )
            )
          ).parens()
        )
      ),
      sc.update(
        sc.id('app.queue')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_queue_updated'),
          sc.value(() => new Date().toISOString())
        ),
        sc.eq(
          sc.id('stat_count_run_busy'),
          sc.minus(
            sc.id('stat_count_run_busy'),
            sc.id('queue_run.status_bit')
          )
        ),
        sc.eq(
          sc.id('stat_count_run_done'),
          sc.plus(
            sc.id('stat_count_run_done'),
            sc.id('queue_run.status_bit')
          )
        )
      ),
      sc.from(
        sc.id('queue_run')
      ),
      sc.where(
        sc.eq(
          sc.id('id_queue'),
          sc.value((box, data) => data.id_queue)
        )
      )
    )
  }

  decide (box, data) {
    return isFinite(data.id_run)
  }
}
