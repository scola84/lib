import isArray from 'lodash/isArray.js'
import { HttpResponder } from '../../worker/api.js'

export class ServerResultResponder extends HttpResponder {
  decide (box, data) {
    return isArray(data) === true &&
      super.decide(box, data)
  }
}
