import { SqlBuilder } from '../../actor/api.js'

export class QueueRunItemInserter extends SqlBuilder {
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
      sc.mergeId('id_item')
    )
  }

  merge (box, data, { rows: [item = {}] }) {
    Object.defineProperty(data.item, 'id_item', {
      value: item.id_item
    })

    return data
  }
}
