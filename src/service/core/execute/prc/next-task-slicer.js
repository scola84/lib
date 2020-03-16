import isArray from 'lodash/isArray.js'
import { Slicer } from '../../../../worker/api.js'

export class NextTaskSlicer extends Slicer {
  decide (box, data) {
    return isArray(data.next) === true &&
      data.status === 'PENDING'
  }

  filter (box, data) {
    box.bid = null

    return data.next.map((task) => {
      return {
        id_item: data.id_item,
        id_queue: data.id_queue,
        id_run: data.id_run,
        data_in: task.data_in,
        data_out: {},
        name: task.name,
        queue: data.queue,
        result: 'return',
        status: 'PENDING'
      }
    })
  }
}
