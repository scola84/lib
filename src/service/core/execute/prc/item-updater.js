import { SqlBuilder } from '../../../../worker/api.js'

export class ItemUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_run_item')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_updated'),
          sc.value(() => new Date().toISOString())
        ),
        sc.eq(
          sc.id('status'),
          sc.value((box, data) => data.status)
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_item'),
            sc.value((box, data) => data.id_item)
          ),
          sc.eq(
            sc.id('status'),
            sc.value('PENDING')
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
