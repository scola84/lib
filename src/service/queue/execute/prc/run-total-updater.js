import { SqlBuilder } from '../../../../worker/api.js'

export class RunTotalUpdater extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.update(
        sb.id('app.queue_run')
      ),
      sb.set(
        sb.eq(
          sb.id('stat_time_updated'),
          sb.value(() => new Date().toISOString())
        ),
        sb.eq(
          sb.id('stat_count_total'),
          sb.value((box, data) => data.run.total)
        )
      ),
      sb.where(
        sb.eq(
          sb.id('id_run'),
          sb.value((box, data) => data.run.id_run)
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
