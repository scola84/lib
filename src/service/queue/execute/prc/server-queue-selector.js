import { SqlBuilder } from '../../../../worker/api.js'

export class ServerQueueSelector extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.select(
        sb.id(
          'id_queue',
          'name'
        )
      ),
      sb.from(
        sb.id('app.queue')
      ),
      sb.where(
        sb.and(
          sb.eq(
            sb.id('name'),
            sb.value((box, data) => data.queue)
          ),
          sb.eq(
            sb.id('scope'),
            sb.value('global')
          )
        )
      )
    )
  }

  merge (box, data, [queue = null]) {
    if (queue === null) {
      throw new Error(`404 Queue "${data.queue}" is not found`)
    }

    data.id_queue = queue.id_queue
    return data
  }
}
