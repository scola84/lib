import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../ops/api.js'

export class TaskInserter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.insert(),
      sc.into(
        sc.id('app.queue_task')
      ),
      sc.id(
        'id_item',
        'id_queue',
        'id_run',
        'cleanup_time',
        'data_in',
        'hash',
        'name',
        'settings',
        'timeout_time'
      ).parens(),
      sc.values(
        sc.value((box, data) => data.id_item),
        sc.value((box, data) => data.id_queue),
        sc.value((box, data) => data.id_run),
        sc.value((box, data) => data.cleanup_time),
        sc.value((box, data) => data.data_in),
        sc.value((box, data) => data.hash),
        sc.value((box, data) => data.name),
        sc.value((box, data) => data.settings),
        sc.value((box, data) => data.timeout_time)
      ),
      sc.mergeInserted(
        sc.id('id_task')
      )
    )
  }

  decide (box, data) {
    return isFinite(data.id_queue) === true &&
      isFinite(data.id_task) === false
  }

  merge (box, data, { rows: [task = {}] }) {
    data.id_task = task.id_task
    return data
  }
}
