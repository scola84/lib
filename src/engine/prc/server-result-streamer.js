import isArray from 'lodash/isArray.js'
import { HttpStreamer } from '../../worker/api.js'

export class ServerResultStreamer extends HttpStreamer {
  decide (box, data, context) {
    return isArray(data) === false &&
      super.decide(box, data, context)
  }
}
