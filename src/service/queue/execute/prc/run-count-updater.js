import { SqlBuilder } from '../../../../worker/api.js'

export class RunCountUpdater extends SqlBuilder {
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
          sb.id((box, data) => `stat_count_${data.status.toLowerCase()}`),
          sb.plus(
            sb.id((box, data) => `stat_count_${data.status.toLowerCase()}`),
            sb.value(1)
          )
        )
      ),
      sb.where(
        sb.eq(
          sb.id('id_run'),
          sb.value((box, data) => data.id_run)
        )
      )
    )
  }

  decide (box, data) {
    return typeof data.id_run === 'number' &&
      (data.status === 'FAILURE' ||
        data.status === 'SUCCESS')
  }
}
