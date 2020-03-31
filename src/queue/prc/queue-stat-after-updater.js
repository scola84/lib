import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../actor/api.js'

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
                    sc.is(
                      sc.id('queue_run.stat_time_item_last'),
                      sc.not(
                        sc.value(null)
                      )
                    )
                  ),
                  sc.then(),
                  sc.case(),
                  sc.when(
                    sc.eq(
                      sc.plus(
                        sc.id('queue_run.stat_count_item_failure'),
                        sc.id('queue_run.stat_count_item_success'),
                        sc.id('queue_run.stat_count_item_timeout')
                      ),
                      sc.id('queue_run.stat_count_item_total')
                    )
                  ),
                  sc.then(1),
                  sc.else(0),
                  sc.end(),
                  sc.else(0),
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
          sc.now()
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
    return isFinite(data.id_run) === true &&
      data.status !== 'PENDING'
  }
}
