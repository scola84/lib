import isError from 'lodash/isError.js'
import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../actor/api.js'

export class RunStatAfterUpdater extends SqlBuilder {
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
          sc.id((box, data) => {
            return isError(data.out.error) === true
              ? 'stat_count_item_failure'
              : 'stat_count_item_success'
          }),
          sc.plus(
            sc.id((box, data) => {
              return isError(data.out.error) === true
                ? 'stat_count_item_failure'
                : 'stat_count_item_success'
            }),
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

  decide (box, data) {
    return isFinite(data.out.id_run) === true &&
      data.out.final === true
  }
}
