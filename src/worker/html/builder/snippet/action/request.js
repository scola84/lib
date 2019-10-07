import { Worker } from '../../../../core'
import { vsprintf } from '../../../../../helper'
import { HttpClient } from '../../../../http'
import { Action } from '../action'

export class Request extends Action {
  constructor (options = {}) {
    super(options)

    this._client = null
    this._indicator = null
    this._merge = null
    this._resource = null

    this.setClient(options.client)
    this.setIndicator(options.indicator)
    this.setMerge(options.merge)
    this.setResource(options.resource)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      indicator: this._indicator,
      merge: this._merge,
      resource: this._resource
    }
  }

  getClient () {
    return this._client
  }

  setClient (value = null) {
    this._client = value
    return this
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

  setMerge (value = null) {
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

  createClient () {
    this._client = new HttpClient({
      merge: (box, data, ...extra) => {
        if (this._merge !== null) {
          return this._merge(box, data, ...extra)
        }

        return data === undefined || data.data === undefined
          ? data
          : data.data
      },
      progress: (box, event) => {
        this.resolveValue(box, event, this._indicator)
      }
    })

    this._client.connect(new Worker({
      act: (box, data) => {
        this.pass(box, data)
      },
      err: (box, error) => {
        this.fail(box, error)
      }
    }))

    return this._client
  }

  resolveAfter (box, data) {
    if (this._client === null) {
      this.createClient()
    }

    const headers = {}

    if (box.multipart === true) {
      headers['Content-Type'] = 'multipart/form-data'
      delete box.multipart
    }

    const options = this.resolveValue(box, data, this._resource)

    let [
      method,
      path = null
    ] = options.split(' ')

    if (path === null) {
      path = method
      method = undefined
    }

    path = vsprintf(this.expand(path), [
      box.params,
      box.list
    ])

    const url = window.location.origin + path.replace(/undefined/g, '')

    const meta = {
      headers,
      method,
      url
    }

    this._client.handle(box, { meta, data })
  }
}
