import { SqlBuilder } from '../../../../worker/api.js'

export class ItemSelector extends SqlBuilder {
  build (sc) {
    return sc.query((box, data) => {
      return this.format(data.queue.selector_query, [data.previous])
    })
  }

  client (box, data) {
    if (typeof data.queue.selector_query === 'string') {
      return this.format(data.queue.selector_client)
    }

    return super.client(box, data)
  }

  decide (box, data) {
    return typeof data.queue === 'object' &&
      typeof data.queue.selector_query === 'string'
  }

  merge (box, data, { row: item, last }) {
    return {
      item,
      last,
      queue: data.queue,
      run: data.run
    }
  }
}
