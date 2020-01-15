import { HttpStreamer } from '../../../../worker/api.js'

export class ServerStreamer extends HttpStreamer {
  decide (box, data) {
    return Array.isArray(data) === false &&
      super.decide(box, data)
  }
}
