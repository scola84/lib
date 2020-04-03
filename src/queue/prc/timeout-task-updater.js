import { SqlBuilder } from '../../actor/api.js'

export class TimeoutTaskUpdater extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.update(
        sc.id('app.queue_task')
      ),
      sc.set(
        sc.eq(
          sc.id('status'),
          sc.value('TIMEOUT')
        )
      ),
      sc.where(
        sc.and(
          sc.eq(
            sc.id('id_task'),
            sc.value((box, data) => data.out.id_task)
          ),
          sc.eq(
            sc.id('status'),
            sc.value('PENDING')
          )
        )
      ),
      sc.mergeCount()
    )
  }

  merge (box, data, result) {
    if (result.success === 0) {
      return {
        out: {}
      }
    }

    return data
  }
}
