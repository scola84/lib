import { HttpClient } from '../../../../http'
import { Action } from '../action'

export class Request extends Action {
  constructor (options = {}) {
    super(options)

    this._indicator = null
    this._resource = null

    this.setIndicator(options.indicator)
    this.setResource(options.resource)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      indicator: this._indicator,
      resource: this._resource
    }
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

  resolveAfter (box, data) {
    let resource = this.resolveValue(box, data, this._resource)

    if (typeof resource === 'string') {
      resource = this.resolveResource(box, data, resource)
    }

    if (box.multipart === true) {
      resource.meta.headers['Content-Type'] = 'multipart/form-data'
      delete box.multipart
    }

    if (box.authorization !== undefined) {
      resource.meta.headers.Authorization = box.authorization
      delete box.authorization
    }

    HttpClient.request(resource, (error, responseData) => {
      this.resolveResponse(box, error, responseData)
    }, (bx, event) => {
      this.resolveValue(box, event, this._indicator)
    })
  }

  resolveError (box, error, data) {
    if (error.status === error.code) {
      this.fail(box, error)
      return
    }

    const call = this._builder
      .call()
      .name(error.status)
      .act(() => {
        this.resolve(box, data)
      })

    call.resolve(box, data)
  }

  resolveResource (box, data, string) {
    let resource = string

    resource = this._builder.format(this.expand(resource), [
      box.params,
      box.list
    ])

    resource = HttpClient.parse(resource.replace(/undefined/g, ''))
    resource.data = data

    return resource
  }

  resolveResponse (box, error, data) {
    if (error !== null) {
      this.resolveError(box, error, data)
      return
    }

    this.pass(box, data)
  }
}
