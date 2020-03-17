import { Worker } from '../../worker/api.js'

export class ServerResultComposer extends Worker {
  act (box, data) {
    this.pass(box, Object.defineProperties({
      data_out: data.data_out,
      error: data.error,
      id_task: data.id_task
    }, {
      index: {
        value: data.index
      }
    }))
  }
}
