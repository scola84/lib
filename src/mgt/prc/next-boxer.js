import { Worker } from '../../ops/api.js'

export class NextBoxer extends Worker {
  act (box, data) {
    this.pass({}, data)
  }
}
