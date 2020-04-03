import { SqlBuilder } from '../../actor/api.js'

export class CleanupTaskDeleter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.delete(),
      sc.from(
        sc.id('app.queue_task')
      ),
      sc.where(
        sc.lt(
          sc.id('cleanup_time'),
          sc.now()
        )
      )
    )
  }
}
