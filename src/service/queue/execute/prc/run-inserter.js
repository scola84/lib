import { SqlBuilder } from '../../../../worker/api.js'

export class RunInserter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.insert(),
      sc.into(
        sc.id('app.queue_run')
      ),
      sc.id(
        'id_queue'
      ).parens(),
      sc.values(
        sc.value((box, data) => data.queue.id_queue)
      ),
      sc.returning('id_run')
    )
  }

  decide (box, data) {
    return typeof data.queue === 'object'
  }

  merge (box, data, [result = {}]) {
    data.run = {
      id_run: result.id_run,
      total: 0
    }

    return data
  }
}
