import isError from 'lodash/isError.js'
import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../actor/api.js'

export class TimeoutRunUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_run')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_id_item_updated'),
          sc.value((box, data) => data.out.id_item)
        ),
        sc.eq(
          sc.id('stat_time_run_updated'),
          sc.now()
        ),
        sc.eq(
          sc.id('stat_count_item_timeout'),
          sc.plus(
            sc.id('stat_count_item_timeout'),
            sc.value(1)
          )
        )
      ),
      sc.where(
        sc.eq(
          sc.id('id_run'),
          sc.value((box, data) => data.out.id_run)
        )
      )
    )
  }

  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return isFinite(data.out.id_run) === true
  }
}
