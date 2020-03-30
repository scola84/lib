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
