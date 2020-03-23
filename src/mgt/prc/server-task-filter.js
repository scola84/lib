import isArray from 'lodash/isArray.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { Worker } from '../../ops/api.js'

export class ServerTaskFilter extends Worker {
  act (box, data) {
    if (isArray(data) === false) {
      throw new Error('400 [mgt] Data is not array')
    }

    for (let i = 0; i < data.length; i += 1) {
      data[i] = this.filterTask(data[i])
    }

    this.pass(box, data)
  }

  filterTask (data) {
    if (isPlainObject(data) === false) {
      throw new Error('400 [mgt] Task is not an object')
    }

    if (isString(data.queue) === false) {
      throw new Error('400 [mgt] Queue name is not a string')
    }

    if (isString(data.name) === false) {
      throw new Error('400 [mgt] Task name is not a string')
    }

    if (['none', 'return', 'stream'].indexOf(data.result) === -1) {
      throw new Error('400 [mgt] Task result type is invalid')
    }

    return {
      cleanup_time: null,
      data_in: isPlainObject(data.data_in) ? data.data_in : {},
      data_out: isPlainObject(data.data_out) ? data.data_out : {},
      error: null,
      name: data.name,
      queue: data.queue,
      result: data.result,
      settings: {},
      status: 'PENDING',
      timeout_time: null
    }
  }
}
