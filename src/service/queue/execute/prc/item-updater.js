import { SqlBuilder } from '../../../../worker/api.js'

export class ItemUpdater extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.update(
        sb.id('app.queue_run_item')
      ),
      sb.set(
        sb.eq(
          sb.id('stat_time_updated'),
          sb.value(() => new Date().toISOString())
        ),
        sb.eq(
          sb.id('status'),
          sb.value((box, data) => data.status)
        )
      ),
      sb.where(
        sb.and(
          sb.eq(
            sb.id('id_item'),
            sb.value((box, data) => data.id_item)
          ),
          sb.eq(
            sb.id('status'),
            sb.value('PENDING')
          )
        )
      )
    )
  }

  decide (box, data) {
    return data.status === 'FAILURE' ||
      data.status === 'SUCCESS'
  }
}
