import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import { HttpResponder } from '../../actor/api.js'

export class ServerResultResponder extends HttpResponder {
  decide (box, data, error) {
    if (isError(error) === true) {
      return super.decide(box, data, error)
    }

    return isArray(data) === true &&
      super.decide(box, data, error)
  }
}
