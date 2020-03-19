import isArray from 'lodash/isArray.js'
import isFinite from 'lodash/isFinite.js'
import { Worker } from '../../worker/api.js'

export class ServerResultComposer extends Worker {
  act (box, data) {
    this.pass(box, Object.defineProperties({
      data_out: data.data_out,
      error: this.error(data.error),
      id_task: data.id_task
    }, {
      index: {
        value: data.index
      }
    }))
  }

  decide (box, data) {
    return isFinite(data.index) === true &&
      isArray(data.next) === false
  }

  err (box, error) {
    this.fail(box, Object.defineProperties({
      error: this.error(error)
    }, {
      index: {
        value: error.index
      }
    }))
  }
}
