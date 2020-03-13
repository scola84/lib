import omit from 'lodash/omit.js'
import { SqlBuilder } from '../../../../worker/api.js'

export class ItemInserter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.insert(),
      sc.into(
        sc.id('app.queue_run_item')
      ),
      sc.id(
        'id_queue',
        'id_run',
        'name',
        'object_name',
        'object_id'
      ).parens(),
      sc.values(
        sc.value((box, data) => data.queue.id_queue),
        sc.value((box, data) => data.run.id_run),
        sc.value((box, data) => data.item.name),
        sc.value((box, data) => data.item.object_name),
        sc.value((box, data) => data.item.object_id)
      ),
      sc.returning('id_item')
    )
  }

  decide (box, data) {
    return typeof data.item === 'object' &&
      typeof data.queue === 'object' &&
      typeof data.run === 'object'
  }

  merge (box, data, { rows: [item = {}] }) {
    return {
      id_item: item.id_item,
      id_queue: data.queue.id_queue,
      id_run: data.run.id_run,
      data_in: omit(data.item, [
        'name',
        'object_name',
        'object_id'
      ]),
      data_out: {},
      name: 'main',
      queue: data.queue.name,
      result: 'return',
      settings: {},
      status: 'PENDING'
    }
  }
}
