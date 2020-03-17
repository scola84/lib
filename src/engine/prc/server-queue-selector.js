import { SqlBuilder } from '../../worker/api.js'

export class ServerQueueSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'id_queue',
          'name'
        )
      ),
      sc.from(
        sc.id('app.queue')
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('name'),
            sc.value((box, data) => data.queue)
          ),
          sc.eq(
            sc.id('scope'),
            sc.value('global')
          )
        )
      )
    )
  }

  merge (box, data, { rows: [queue = null] }) {
    if (queue === null) {
      throw new Error(`404 Queue '${data.queue}' is not found`)
    }

    data.id_queue = queue.id_queue
    return data
  }
}
