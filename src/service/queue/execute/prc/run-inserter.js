import { SqlBuilder } from '../../../../worker/api.js'

export class RunInserter extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.insert(),
      sb.into(
        sb.id('app.queue_run')
      ),
      sb.id(
        'id_queue'
      ).parens(),
      sb.values(
        sb.value((box, data) => data.queue.id_queue)
      ),
      sb.returning('id_run')
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
