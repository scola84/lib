import omit from 'lodash/omit.js'
import { Worker } from '../../actor/api.js'

export class TaskComposer extends Worker {
  act (box, data) {
    this.pass(box, {
      id_item: data.item.id_item,
      id_queue: data.queue.id_queue,
      id_run: data.run.id_run,
      cleanup_time: null,
      data: omit(data.item, [
        'id_item'
      ]),
      error: null,
      final: false,
      name: 'main',
      queue: data.queue.name,
      result: 'return',
      settings: {},
      status: 'PENDING',
      timeout_time: null
    })
  }
}
