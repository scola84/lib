import { HttpResponder } from '../../../../worker/api.js'

export class ServerResponder extends HttpResponder {
  decide (box, data) {
    return Array.isArray(data) === true &&
      super.decide(box, data)
  }
}
