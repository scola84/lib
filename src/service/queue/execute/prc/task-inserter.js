import { SqlBuilder } from '../../../../worker/api.js'

export class TaskInserter extends SqlBuilder {
  build (sb) {
    return sb.query(
      sb.insert(),
      sb.into(
        sb.id('app.queue_run_item_task')
      ),
      sb.id(
        'id_item',
        'id_queue',
        'id_run',
        'data_in',
        'hash',
        'name'
      ).parens(),
      sb.values(
        sb.value((box, data) => data.id_item),
        sb.value((box, data) => data.id_queue),
        sb.value((box, data) => data.id_run),
        sb.value((box, data) => JSON.stringify(data.data_in)),
        sb.value((box, data) => data.hash),
        sb.value((box, data) => data.name)
      ),
      sb.returning('id_task')
    )
  }

  merge (box, data, [result = {}]) {
    data.id_task = result.id_task
    return data
  }
}
