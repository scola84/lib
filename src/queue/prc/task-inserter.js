import isError from 'lodash/isError.js'
import isFinite from 'lodash/isFinite.js'
import { SqlBuilder } from '../../actor/api.js'

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
        'data',
        'hash',
        'name',
        'options',
        'timeout_time'
      ).parens(),
      sc.values(
        sc.value((box, data) => data.out.id_item),
        sc.value((box, data) => data.out.id_queue),
        sc.value((box, data) => data.out.id_run),
        sc.value((box, data) => data.in.cleanup_time),
        sc.value((box, data) => data.in.data),
        sc.value((box, data) => data.in.hash),
        sc.value((box, data) => data.name),
        sc.value((box, data) => data.in.options),
        sc.value((box, data) => data.in.timeout_time)
      ),
      sc.mergeId('id_task')
    )
  }

  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return isFinite(data.out.id_queue) === true &&
      isFinite(data.out.id_task) === false
  }

  merge (box, data, { rows: [task = {}] }) {
    data.out.id_task = task.id_task
    return data
  }
}
