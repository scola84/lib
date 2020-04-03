import isError from 'lodash/isError.js'
import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../actor/api.js'

export class TimeoutItemUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_item')
      ),
      sc.set(
        sc.eq(
          sc.id('status'),
          sc.value('TIMEOUT')
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
      ),
      sc.mergeCount()
    )
  }

  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return isFinite(data.out.id_item) === true
  }

  merge (box, data, result) {
    if (result.success === 0) {
      return {
        out: {}
      }
    }

    return data
  }
}
