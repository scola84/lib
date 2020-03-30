import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../ops/api.js'

export class RunStatAfterUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_run')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_run_updated'),
          sc.now()
        ),
        sc.eq(
          sc.id((box, data) => `stat_count_item_${data.status.toLowerCase()}`),
          sc.plus(
            sc.id((box, data) => `stat_count_item_${data.status.toLowerCase()}`),
            sc.value(1)
          )
        )
      ),
      sc.where(
        sc.eq(
          sc.id('id_run'),
          sc.value((box, data) => data.id_run)
        )
      )
    )
  }

  decide (box, data) {
    return isFinite(data.id_run) === true &&
      data.status !== 'PENDING'
  }
}
