import { Queuer } from '../../actor/api.js'

export class TaskPusher extends Queuer {
  fail (box, data, error) {
    this.log('fail', '', [error], box.rid)

    if (this._downstream !== null) {
      this.callDownstream(box, data, error)
    }
  }
}
