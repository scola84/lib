import cron from 'cron-parser'
import { SqlBuilder } from '../../../../worker/api.js'

export class TriggerQueueUpdater extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.update(
        sb.id('app.queue')
      ),
      sb.set(
        sb.eq(
          sb.id('trigger_schedule_next'),
          sb.value((box, data) => {
            return cron
              .parseExpression(data.queue.trigger_schedule)
              .next()
              .toString()
          })
        )
      ),
      sb.where(
        sb.eq(
          sb.id('id_queue'),
          sb.value((box, data) => data.queue.id_queue)
        )
      )
    )
  }

  decide (box, data) {
    return typeof data.queue === 'object' &&
      data.queue.trigger_schedule === 'string'
  }
}
