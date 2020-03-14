import isPlainObject from 'lodash/isPlainObject.js'
import { SqlBuilder } from '../../../../worker/api.js'

export class RunTotalUpdater extends SqlBuilder {
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
          sc.id('stat_count_total'),
          sc.value((box, data) => data.run.total)
        )
      ),
      sc.where(
        sc.eq(
          sc.id('id_run'),
          sc.value((box, data) => data.run.id_run)
        )
      )
    )
  }

  decide (box, data) {
    if (isPlainObject(data.run) === true) {
      data.run.total += 1
      return data.last === true
    }

    return false
  }
}
