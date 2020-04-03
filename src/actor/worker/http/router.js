import isError from 'lodash/isError.js'
import isPlainObject from 'lodash/isPlainObject.js'
import { Router } from '../core/index.js'

export class HttpRouter extends Router {
  constructor (options) {
    super(options)
    this._resources = null
  }

  act (box, data) {
    if (this._resources === null) {
      this._resources = this.createResources()
    }

    const { request } = box[`server.${this._name}`]

    const method = request.getMethod()
    const url = request.getUrl()

    let name = null
    let params = null
    let resource = null

    this.log('info', 'Routing request %o %o', [method, url.pathname], box.rid)

    for (let i = 0; i < this._resources.length; i += 1) {
      resource = this._resources[i]
      params = resource.regexp.exec(`${url.pathname}`)

      if (params !== null) {
        if (resource.methods.indexOf(method) === -1) {
          this.handleMethodError(box, data, resource.methods, method)
          return
        }

        name = `${method} ${resource.pathname}`
        request.params = params.groups || params

        this._downstreams[name].callAct(box, data)
        return
      }
    }

    this.handlePathError(box, data, url.pathname)
  }

  decide (box, data, error) {
    if (isError(error) === true) {
      return false
    }

    return isPlainObject(box[`server.${this._name}`]) === true
  }

  createResources () {
    const resources = {}
    const names = Object.keys(this._downstreams)

    let method = null
    let name = null
    let pathname = null

    for (let i = 0; i < names.length; i += 1) {
      name = names[i];
      [method, pathname] = name.split(' ')

      resources[pathname] = resources[pathname] || {
        methods: [],
        pathname,
        regexp: new RegExp(pathname)
      }

      resources[pathname].methods.push(method)
    }

    return Object.values(resources)
  }

  handleMethodError (box, data, methods, method) {
    box[`server.${this._name}`].response.setHeader('Allow', methods)
    this.fail(box, data, new Error(`405 [router] Method '${method}' is not allowed`))
  }

  handlePathError (box, data, path) {
    this.fail(box, data, new Error(`404 [router] Resource '${path}' is not found`))
  }
}
