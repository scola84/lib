import { Router } from '../core'

export class HttpRouter extends Router {
  constructor (options) {
    super(options)
    this._resources = null
  }

  act (box, data) {
    if (this._resources === null) {
      this._resources = this.createResources()
    }

    let name = null
    let params = null
    let resource = null

    for (let i = 0; i < this._resources.length; i += 1) {
      resource = this._resources[i]
      params = resource.regexp.exec(`${box.request.url.pathname}`)

      if (params !== null) {
        if (resource.methods.indexOf(box.request.method) === -1) {
          this.handleMethodError(box, data, resource.methods)
          return
        }

        name = `${box.request.method} ${resource.pathname}`
        box.request.params = params.groups || params

        this._downstreams[name].handleAct(box, data)
        return
      }
    }

    this.handlePathError(box, data)
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

  handleMethodError (box, data, methods) {
    box.response.setHeader('Allow', methods)
    this.fail(box, new Error('405 Method not allowed'))
  }

  handlePathError (box) {
    this.fail(box, new Error('404 Resource not found'))
  }
}
