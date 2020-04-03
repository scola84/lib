import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import { HttpStreamer } from '../../actor/api.js'

export class ServerResultStreamer extends HttpStreamer {
  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return isArray(data) === false &&
      super.decide(box, data, error)
  }
}
