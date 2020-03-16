import isPlainObject from 'lodash/isPlainObject.js'
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
      sc.returning(
        sc.id('id_run')
      )
    )
  }

  decide (box, data) {
    return isPlainObject(data.queue) === true
  }

  merge (box, data, { rows: [run = {}] }) {
    data.run = {
      id_run: run.id_run,
      total: 0
    }

    return data
  }
}
