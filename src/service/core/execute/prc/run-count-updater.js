import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../../../worker/api.js'

export class RunCountUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_run')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_updated'),
          sc.value(() => new Date().toISOString())
        ),
        sc.eq(
          sc.id((box, data) => `stat_count_${data.status.toLowerCase()}`),
          sc.plus(
            sc.id((box, data) => `stat_count_${data.status.toLowerCase()}`),
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
      (data.status === 'FAILURE' ||
        data.status === 'SUCCESS')
  }
}
