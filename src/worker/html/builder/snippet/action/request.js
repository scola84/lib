import sprintf from 'sprintf-js'
import { HttpClient } from '../../../../http'
import { Worker } from '../../../../core'
import { Action } from '../action'

export class Request extends Action {
  constructor (options = {}) {
    super(options)

    this._indicator = null
    this._merge = null
    this._resource = null

    this.setIndicator(options.indicator)
    this.setMerge(options.merge)
    this.setResource(options.resource)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      indicator: this._indicator,
      merge: this._merge,
      resource: this._resource
    })
  }

  getIndicator () {
    return this._indicator
  }

  setIndicator (value = null) {
    this._indicator = value
    return this
  }

  indicator (value) {
    return this.setIndicator(value)
  }

  getMerge () {
    return this._merge
  }

  setMerge (value = (box, data) => data ? data.data : data) {
    this._merge = value
    return this
  }

  merge (value) {
    return this.setMerge(value)
  }

  getResource () {
    return this._resource
  }

  setResource (value = null) {
    this._resource = value
    return this
  }

  resource (value) {
    return this.setResource(value)
  }

  createClient (box, data) {
    const client = new HttpClient({
      filter: (meta) => {
        return {
          meta,
          data
        }
      },
      merge: (box, data) => {
        return this._merge(box, data)
      },
      progress: (event) => {
        this.resolveValue(box, event, this._indicator)
      }
    })

    const resolver = new Worker({
      act: (box, data) => {
        this.pass(box, data)
      },
      err: (box, error) => {
        this.fail(box, error)
      }
    })

    client
      .connect(resolver)

    return client
  }

  resolveAfter (box, data) {
    const client = this.createClient(box, data)
    const options = this.resolveValue(box, data, this._resource)

    let [
      method,
      meta = null
    ] = options.split(' ')

    if (meta === null) {
      meta = method
      method = undefined
    }

    meta = sprintf.sprintf(
      this.expand(meta),
      Object.assign({}, box.params, box.list)
    )

    meta = window.location.origin +
      meta.replace(/undefined/g, '')

    client.handle(meta)
  }
}
