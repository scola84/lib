import { SqlBuilder } from '../../ops/api.js'

export class CleanupTriggerRunDeleter extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.delete(),
      sc.from(
        sc.id('app.queue_run')
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
