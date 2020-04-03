import { Worker } from '../../actor/api.js'

export class TaskComposer extends Worker {
  act (box, data) {
    this.pass(box, {
      id: data.item.id_item,
      in: {
        cleanup_time: null,
        data: data.item,
        hash: null,
        options: {},
        timeout_time: null
      },
      name: 'main',
      out: {
        data: null,
        error: null,
        final: false,
        id_item: data.item.id_item,
        id_queue: data.queue.id_queue,
        id_run: data.run.id_run,
        id_task: null,
        next: []
      },
      queue: data.queue.name,
      result: 'return'
    })
  }
}
