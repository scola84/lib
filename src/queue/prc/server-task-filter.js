import defaults from 'lodash/defaultsDeep.js'
import isArray from 'lodash/isArray.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { Worker } from '../../actor/api.js'

export class ServerTaskFilter extends Worker {
  act (box, data) {
    if (isArray(data) === false) {
      this.fail(box, data, new Error('400 [queue] Data is not an array'))
      return
    }

    for (let i = 0; i < data.length; i += 1) {
      data[i] = this.filterTask(data[i])
    }

    this.pass(box, data)
  }

  filterTask (task) {
    if (isPlainObject(task) === false) {
      throw new Error('400 [queue] Task is not an object')
    }

    if (isString(task.queue) === false) {
      throw new Error('400 [queue] Queue name is not a string')
    }

    return defaults({
      id: null,
      in: {
        cleanup_time: null,
        hash: null,
        options: {},
        timeout_time: null
      },
      out: {
        data: null,
        error: null,
        final: false,
        id_item: null,
        id_queue: null,
        id_run: null,
        id_task: null,
        next: []
      }
    }, {
      in: {
        data: task.data
      },
      name: task.name,
      queue: task.queue,
      result: task.result
    }, {
      in: {
        data: {}
      },
      name: 'main',
      queue: null,
      result: 'return'
    })
  }
}
