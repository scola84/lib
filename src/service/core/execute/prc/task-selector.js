import { SqlBuilder } from '../../../../worker/api.js'

export class TaskSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'settings'
        )
      ),
      sc.from(
        sc.id('app.queue_task')
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_queue'),
            sc.value((box, data) => data.id_queue)
          ),
          sc.eq(
            sc.id('name'),
            sc.value((box, data) => data.name)
          )
        )
      )
    )
  }

  merge (box, data, { rows: [task = null] }) {
    if (task === null) {
      return data
    }

    data.settings = JSON.parse(task.settings)

    return data
  }
}
