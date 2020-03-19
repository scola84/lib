import isPlainObject from 'lodash/isPlainObject.js'
import { Slicer } from '../../worker/api.js'

export class ServerTaskSlicer extends Slicer {
  merge (box, data, index) {
    return super.merge(box, {
      data_in: isPlainObject(data.data_in) ? data.data_in : {},
      data_out: isPlainObject(data.data_out) ? data.data_out : {},
      error: null,
      name: data.name,
      queue: data.queue,
      result: data.result,
      settings: {},
      status: 'PENDING',
      timeout_time: null
    }, index)
  }
}
