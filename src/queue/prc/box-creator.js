import { Worker } from '../../actor/api.js'

export class BoxCreator extends Worker {
  act (box, data) {
    this.pass({ ...box, bid: null }, data)
  }
}
