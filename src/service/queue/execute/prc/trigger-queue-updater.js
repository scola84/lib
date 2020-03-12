import cron from 'cron-parser'
import { SqlBuilder } from '../../../../worker/api.js'

export class TriggerQueueUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue')
      ),
      sc.set(
        sc.eq(
          sc.id('trigger_schedule_next'),
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

  decide (box, data) {
    return typeof data.queue === 'object' &&
      data.queue.trigger_schedule === 'string'
  }
}
