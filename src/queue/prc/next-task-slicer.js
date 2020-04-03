import defaults from 'lodash/defaultsDeep.js'
import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import { Slicer } from '../../actor/api.js'

export class NextTaskSlicer extends Slicer {
  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return isArray(data.out.next) === true &&
      data.out.final === false
  }

  filter (box, data) {
    return data.out.next.map((task) => {
      return defaults({
        id: data.out.id_item,
        in: {
          cleanup_time: null,
          options: {},
          timeout_time: null
        },
        out: {
          data: null,
          error: null,
          final: false,
          id_item: data.out.id_item,
          id_queue: data.out.id_queue,
          id_run: data.out.id_run,
          id_task: null,
          next: []
        },
        queue: data.queue,
        result: 'return'
      }, task, {
        in: {
          data: {},
          hash: null
        },
        name: null
      })
    })
  }
}
