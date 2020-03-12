import { Slicer } from '../../../../worker/api.js'

export class ServerTaskSlicer extends Slicer {
  merge (box, data, index) {
    return super.merge(box, {
      data_in: data.data_in,
      data_out: {},
      name: data.name,
      queue: data.queue,
      result: data.result,
      settings: {},
      status: 'PENDING'
    }, index)
  }
}
