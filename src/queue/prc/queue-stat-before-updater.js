import isError from 'lodash/isError.js'
import { SqlBuilder } from '../../actor/api.js'

export class QueueStatBeforeUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
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

  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return data.first === true
  }
}
