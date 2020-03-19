import { SqlBuilder } from '../../worker/api.js'

export class ServerQueueSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'id_queue'
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

  merge (box, data, { rows: [queue = {}] }) {
    data.id_queue = queue.id_queue
    return data
  }
}
