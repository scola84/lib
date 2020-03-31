import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../actor/api.js'

export class TimeoutTriggerItemUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_item')
      ),
      sc.set(
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
      ),
      sc.mergeUpdated()
    )
  }

  decide (box, data) {
    return isFinite(data.id_item) === true
  }

  merge (box, data, result) {
    if (result.count === 0) {
      return {}
    }

    return data
  }
}
