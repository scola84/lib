import omit from 'lodash/omit.js'
import { SqlBuilder } from '../../../../worker/api.js'

export class ItemInserter extends SqlBuilder {
  setKey (value = 'id_item') {
    return super.setKey(value)
  }

  setType (value = 'insert') {
    return super.setType(value)
  }

  build (sb) {
    return sb.query(
      sb.insert(),
      sb.into(
        sb.id('app.queue_run_item')
      ),
      sb.id(
        'id_queue',
        'id_run',
        'name',
        'object_name',
        'object_id'
      ).parens(),
      sb.values(
        sb.value((box, data) => data.queue.id_queue),
        sb.value((box, data) => data.run.id_run),
        sb.value((box, data) => data.item.name),
        sb.value((box, data) => data.item.object_name),
        sb.value((box, data) => data.item.object_id)
      )
    )
  }

  decide (box, data) {
    return typeof data.item === 'object' &&
      typeof data.queue === 'object' &&
      typeof data.run === 'object'
  }

  merge (box, data, [idItem]) {
    return {
      id_item: idItem,
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
      status: 'PENDING'
    }
  }
}
