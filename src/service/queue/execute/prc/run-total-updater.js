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
    if (typeof data.run === 'object') {
      data.run.total += 1
      return data.last === true
    }

    return false
  }
}
