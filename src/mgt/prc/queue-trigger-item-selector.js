import isString from 'lodash/isString.js'
import { SqlBuilder } from '../../ops/api.js'

export class QueueTriggerItemSelector extends SqlBuilder {
  build (sc) {
    return sc.query((box, data) => {
      if (isString(data.queue.trigger_selector_query) === true) {
        return this.buildFromQueue(sc, box, data)
      }

      return this.buildDefault(sc, box, data)
    })
  }

  buildDefault (sc) {
    return sc.select(
      sc.as(
        sc.value('default'),
        sc.id('name')
      )
    )
  }

  buildFromQueue (sc, box, data) {
    return this.format(data.queue.trigger_selector_query, [data.previous])
  }

  client (box, data) {
    if (isString(data.queue.trigger_selector_query) === true) {
      return this.format(data.queue.trigger_selector_client)
    }

    return super.client(box, data)
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
