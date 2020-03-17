import { SqlBuilder } from '../../worker/api.js'

export class RunTriggerItemSelector extends SqlBuilder {
  build (sc) {
    return sc.query(
      sc.select(
        sc.id(
          'queue_item.id_item',
          'queue_item.id',
          'queue_item.name',
          'queue_item.type'
        )
      ),
      sc.from(
        sc.id('app.queue_item')
      ),
      sc.where(
        sc.eq(
          sc.id('queue_item.id_run'),
          sc.value((box, data) => data.run.id_run)
        )
      )
    )
  }

  merge (box, data, { first, last, total, row: item }) {
    data.run.total = total

    return {
      first,
      item,
      last,
      queue: data.queue,
      run: data.run
    }
  }
}
