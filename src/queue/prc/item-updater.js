import isError from 'lodash/isError.js'
import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../actor/api.js'

export class ItemUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_item')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_item_updated'),
          sc.now()
        ),
        sc.eq(
          sc.id('status'),
          sc.value((box, data) => {
            return isError(data.out.error) === true
              ? 'FAILURE'
              : 'SUCCESS'
          })
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_item'),
            sc.value((box, data) => data.out.id_item)
          ),
          sc.eq(
            sc.id('status'),
            sc.value('PENDING')
          )
        )
      )
    )
  }

  decide (box, data, error) {
    return isFinite(data.out.id_run) === true &&
      data.out.final === true
  }
}
