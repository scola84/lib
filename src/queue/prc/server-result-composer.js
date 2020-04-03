import isPlainObject from 'lodash/isPlainObject.js'
import { Worker } from '../../actor/api.js'

export class ServerResultComposer extends Worker {
  act (box, data) {
    const result = Object.defineProperties({}, {
      data: {
        enumerable: true,
        value: isPlainObject(data.out.data) === true
          ? data.out.data
          : undefined
      },
      error: {
        enumerable: true,
        value: this.transformError(data.out.error)
      },
      id: {
        enumerable: true,
        value: data.result === 'stream'
          ? data.out.id_task
          : undefined
      },
      index: {
        value: data.index
      }
    })

    if (isPlainObject(result.error) === true) {
      Object.defineProperties(result.error, {
        stack: {
          enumerable: false
        }
      })
    }

    this.pass(box, result)
  }

  decide (box) {
    return isPlainObject(box[`server.${this._name}`]) === true
  }

  err (box, data, error) {
    Object.assign(data.out, {
      error,
      data: null
    })

    this.act(box, data)
  }
}
