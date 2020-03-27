import isArray from 'lodash/isArray.js'
import { Worker } from '../../ops/api.js'

export class ServerResultComposer extends Worker {
  act (box, data) {
    this.pass(box, Object.defineProperties({
      data_out: data.data_out,
      error: this.transformError(data.error),
      id_task: data.id_task
    }, {
      index: {
        value: data.index
      }
    }))
  }

  decide (box, data) {
    return isArray(data.next) === false
  }

  err (box, error) {
    this.fail(box, Object.defineProperties({
      error: this.transformError(error)
    }, {
      index: {
        value: error.index
      }
    }))
  }
}
