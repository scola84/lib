import { SqlBuilder } from '../../worker/api.js'

export class QueueTriggerRunInserter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.insert(),
      sc.into(
        sc.id('app.queue_run')
      ),
      sc.id(
        'id_queue',
        'cleanup_time'
      ).parens(),
      sc.values(
        sc.value((box, data) => data.run.id_queue),
        sc.value((box, data) => data.run.cleanup_time)
      ),
      sc.returning(
        sc.id('id_run')
      )
    )
  }

  merge (box, data, { rows: [run = {}] }) {
    data.run.id_run = run.id_run
    return data
  }
}
