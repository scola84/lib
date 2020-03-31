import isArray from 'lodash/isArray.js'
import { HttpStreamer } from '../../actor/api.js'

export class ServerResultStreamer extends HttpStreamer {
  decide (box, data, context) {
    if (context === 'err') {
      return false
    }

    return isArray(data) === false &&
      super.decide(box, data, context)
  }
}
