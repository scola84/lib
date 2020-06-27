import isError from 'lodash/isError.js'
import isString from 'lodash/isString.js'
import { HttpClient } from '../../../../../http/index.js'
import { Action } from '../action.js'

export class Request extends Action {
  constructor (options = {}) {
    super(options)

    this._call = null
    this._indicator = null
    this._resource = null

    this.setCall(options.call)
    this.setIndicator(options.indicator)
    this.setResource(options.resource)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      call: this._call,
      indicator: this._indicator,
      resource: this._resource
    }
  }

  getCall () {
    return this._call
  }

  setCall (value = true) {
    this._call = value
    return this
  }

  call (value) {
    return this.setCall(value)
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

    if (isString(resource) === true) {
      resource = this.resolveResource(box, data, resource)
    }

    if (box.multipart === true) {
      resource.headers['Content-Type'] = 'multipart/form-data'
      delete box.multipart
    }

    if (isString(box.authorization) === true) {
      resource.headers.Authorization = box.authorization
      delete box.authorization
    }

    HttpClient.request(resource, (error, responseData) => {
      this.resolveResponse(box, error, responseData)
    }, (bx, event) => {
      this.resolveValue(box, event, this._indicator)
    })
  }

  resolveError (box, error, data) {
    if (error.type === error.code) {
      this.fail(box, error)
      return
    }

    if (this._call === false) {
      this.fail(box, error)
      return
    }

    const call = this._origin
      .call()
      .name(error.type)
      .act(() => {
        this.resolve(box, data)
      })
      .err((bx, callError) => {
        this.fail(box, callError)
      })

    call.resolve(box, data)
  }

  resolveResource (box, data, string) {
    let resource = string

    resource = this._origin.format(this.expand(resource), [
      box.params,
      box.list
    ])

    resource = HttpClient.parse(resource.replace(/undefined/g, ''))
    resource.body = data

    return resource
  }

  resolveResponse (box, error, data) {
    if (isError(error) === true) {
      this.resolveError(box, error, data)
      return
    }

    this.pass(box, data)
  }
}
