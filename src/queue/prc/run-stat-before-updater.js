import { SqlBuilder } from '../../actor/api.js'

export class RunStatBeforeUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_run')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_run_updated'),
          sc.now()
        ),
        sc.eq(
          sc.id('stat_time_item_first'),
          (box, data) => {
            if (data.first === true) {
              return sc.now()
            }

            return sc.id('stat_time_item_first')
          }
        ),
        sc.eq(
          sc.id('stat_time_item_last'),
          (box, data) => {
            if (data.last === true) {
              return sc.now()
            }

            return sc.id('stat_time_item_last')
          }
        ),
        sc.eq(
          sc.id('stat_count_item_total'),
          (box, data) => {
            if (data.last === true) {
              return sc.value(data.run.total)
            }

            return sc.id('stat_count_item_total')
          }
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
    return data.first === true || data.last === true
  }
}
