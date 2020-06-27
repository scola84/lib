import isError from 'lodash/isError.js'
import isString from 'lodash/isString.js'
import cron from 'cron-parser'
import { SqlBuilder } from '../../actor/api.js'

export class QueueUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue')
      ),
      sc.set(
        sc.eq(
          sc.id('stat_time_queue_updated'),
          sc.now()
        ),
        sc.eq(
          sc.id('trigger_time'),
          sc.value((box, data) => {
            return cron
              .parseExpression(data.queue.trigger_schedule)
              .next()
              .toString()
          })
        )
      ),
      sc.where(
        sc.eq(
          sc.id('id_queue'),
          sc.value((box, data) => data.queue.id_queue)
        )
      )
    )
  }

  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return isString(data.queue.trigger_schedule) === true
  }
}