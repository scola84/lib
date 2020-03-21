import isArray from 'lodash/isArray.js'
import { HttpResponder } from '../../worker/api.js'

export class ServerResultResponder extends HttpResponder {
  decide (box, data, context) {
    if (context === 'err') {
      return super.decide(box, data, context)
    }

    return isArray(data) === true &&
      super.decide(box, data, context)
  }
}
