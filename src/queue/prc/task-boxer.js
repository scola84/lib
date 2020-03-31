import { Worker } from '../../actor/api.js'

export class TaskBoxer extends Worker {
  act (box, data) {
    this.pass({ ...box }, data)
  }
}
