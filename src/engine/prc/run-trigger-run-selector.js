import { SqlBuilder } from '../../worker/api.js'

export class RunTriggerRunSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'queue.id_queue',
          'queue.stat_count_run_busy',
          'queue.stat_count_run_done',
          'queue.name',
          'queue.trigger_condition',
          'queue_run.id_run'
        )
      ),
      sc.from(
        sc.id('app.queue_run')
      ),
      sc.left(),
      sc.join(
        sc.id('app.queue')
      ),
      sc.on(
        sc.eq(
          sc.id('queue_run.id_queue'),
          sc.id('queue.id_queue')
        )
      ),
      sc.where(
        sc.and(
          sc.is(
            sc.id('queue_run.stat_time_item_first'),
            sc.value(null)
          ),
          sc.lt(
            sc.id('queue_run.trigger_time'),
            sc.now()
          )
        )
      )
    )
  }

  merge (box, data, { row }) {
    return {
      queue: {
        id_queue: row.id_queue,
        name: row.name,
        trigger_condition: row.trigger_condition
      },
      run: {
        id_run: row.id_run,
        total: 0
      }
    }
  }
}
