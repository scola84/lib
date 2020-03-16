import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { SqlBuilder } from '../../../../worker/api.js'

export class ItemSelector extends SqlBuilder {
  build (sc) {
    return sc.query((box, data) => {
      return this.format(data.queue.selector_query, [data.previous])
    })
  }

  client (box, data) {
    if (isString(data.queue.selector_query) === true) {
      return this.format(data.queue.selector_client)
    }

    return super.client(box, data)
  }

  decide (box, data) {
    return isPlainObject(data.queue) === true &&
      isString(data.queue.selector_query) === true
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
