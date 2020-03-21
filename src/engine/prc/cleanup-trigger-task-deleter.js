import { SqlBuilder } from '../../worker/api.js'

export class CleanupTriggerTaskDeleter extends SqlBuilder {
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
