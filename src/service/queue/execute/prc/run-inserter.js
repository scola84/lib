import { SqlBuilder } from '../../../../worker/api.js'

export class RunInserter extends SqlBuilder {
  setKey (value = 'id_run') {
    return super.setKey(value)
  }

  setType (value = 'insert') {
    return super.setType(value)
  }

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
      )
    )
  }

  decide (box, data) {
    return typeof data.queue === 'object'
  }

  merge (box, data, [idRun]) {
    data.run = {
      id_run: idRun,
      total: 0
    }

    return data
  }
}
