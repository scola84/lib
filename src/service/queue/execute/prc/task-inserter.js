import { SqlBuilder } from '../../../../worker/api.js'

export class TaskInserter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.insert(),
      sc.into(
        sc.id('app.queue_run_item_task')
      ),
      sc.id(
        'id_item',
        'id_queue',
        'id_run',
        'data_in',
        'hash',
        'name',
        'settings'
      ).parens(),
      sc.values(
        sc.value((box, data) => data.id_item),
        sc.value((box, data) => data.id_queue),
        sc.value((box, data) => data.id_run),
        sc.value((box, data) => JSON.stringify(data.data_in)),
        sc.value((box, data) => data.hash),
        sc.value((box, data) => data.name),
        sc.value((box, data) => data.settings)
      ),
      sc.returning('id_task')
    )
  }

  merge (box, data, { rows: [task = {}] }) {
    data.id_task = task.id_task
    return data
  }
}
