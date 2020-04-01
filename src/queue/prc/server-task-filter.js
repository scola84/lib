import isArray from 'lodash/isArray.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { Worker } from '../../actor/api.js'

export class ServerTaskFilter extends Worker {
  act (box, data) {
    if (isArray(data) === false) {
      throw new Error('400 [queue] Data is not array')
    }

    for (let i = 0; i < data.length; i += 1) {
      data[i] = this.filterTask(data[i])
    }

    this.pass(box, data)
  }

  filterTask (data) {
    if (isPlainObject(data) === false) {
      throw new Error('400 [queue] Task is not an object')
    }

    if (isString(data.queue) === false) {
      throw new Error('400 [queue] Queue name is not a string')
    }

    return {
      cleanup_time: null,
      data: isPlainObject(data.data) ? data.data : {},
      error: null,
      final: false,
      name: isString(data.name) ? data.name : 'main',
      queue: data.queue,
      result: isString(data.result) ? data.result : 'return',
      settings: {},
      status: 'PENDING',
      timeout_time: null
    }
  }
}
