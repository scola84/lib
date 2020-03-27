import { SqlBuilder } from '../../ops/api.js'

export class QueueTriggerItemInserter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.insert(),
      sc.into(
        sc.id('app.queue_item')
      ),
      sc.id(
        'id_queue',
        'id_run',
        'cleanup_time',
        'id',
        'name',
        'type'
      ).parens(),
      sc.values(
        sc.value((box, data) => data.queue.id_queue),
        sc.value((box, data) => data.run.id_run),
        sc.value((box, data) => data.queue.cleanup_time),
        sc.value((box, data) => data.item.id),
        sc.value((box, data) => data.item.name),
        sc.value((box, data) => data.item.type)
      ),
      sc.mergeInserted(
        sc.id('id_item')
      )
    )
  }

  merge (box, data, { rows: [item = {}] }) {
    data.item.id_item = item.id_item
    return data
  }
}
