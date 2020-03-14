import isArray from 'lodash/isArray.js'
import { HttpStreamer } from '../../../../worker/api.js'

export class ServerStreamer extends HttpStreamer {
  decide (box, data) {
    return isArray(data) === false &&
      super.decide(box, data)
  }
}
