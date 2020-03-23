import { SqlBuilder } from '../../ops/api.js'

export class TimeoutTriggerTaskUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_task')
      ),
      sc.set(
        sc.eq(
          sc.id('status'),
          sc.value((box, data) => data.status)
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_task'),
            sc.value((box, data) => data.id_task)
          ),
          sc.eq(
            sc.id('status'),
            sc.value('PENDING')
          )
        )
      ),
      sc.mergeUpdated()
    )
  }

  merge (box, data, result) {
    if (result.count === 0) {
      return {}
    }

    return data
  }
}
