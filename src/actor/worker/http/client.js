import fetch from 'node-fetch'
import isError from 'lodash/isError.js'
import isNil from 'lodash/isNil.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import qs from 'qs'
import { Builder } from '../core/index.js'
import { Request } from './client/message/index.js'
import { map as authMap } from './client/auth/index.js'

export class HttpClient extends Builder {
  static parse (resource) {
    if (isPlainObject(resource) === true) {
      return resource
    }

    let [method, url = null] = resource.split(' ')

    if (url === null) {
      url = method
      method = undefined
    }

    return {
      method,
      url
    }
  }

  static request (resource, callback, progress) {
    const client = new HttpClient({
      progress,
      merge (box, data, object) {
        return object
      }
    })

    client.connect(new Worker({
      act (box, data) {
        callback(null, data)
      },
      decide () {
        return true
      },
      err (box, data, error) {
        callback(error)
      }
    }))

    client.call({}, HttpClient.parse(resource))
  }

  constructor (options = {}) {
    super(options)

    this._auth = null
    this._build = null
    this._progress = null

    this.setAuth(options.auth)
    this.setBuild(options.build)
    this.setProgress(options.progress)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      auth: this._auth,
      build: this._build,
      progress: this._progress
    }
  }

  getAuth () {
    return this._auth
  }

  setAuth (value = null) {
    this._auth = value
    return this
  }

  getBuild () {
    return this._build
  }

  setBuild (value = null) {
    this._build = value
    return this
  }

  setModules (value = { FetchRequest: fetch.Request, Request }) {
    return super.setModules(value)
  }

  getProgress () {
    return this._progress
  }

  setProgress (value = () => {}) {
    this._progress = value
    return this
  }

  act (box, data) {
    let init = this.resolve('build', box, data)

    const {
      body = null,
      headers = {},
      method = 'GET',
      query = {},
      url = ''
    } = init

    const auth = this.resolveAuth(box, data, init)

    if (auth !== null) {
      headers.Authorization = auth.createHeader(init)
    }

    init = {
      ...init,
      headers,
      method,
      query,
      url,
      body: null
    }

    const request = this.newModule(
      'Request',
      this.newModule(
        'FetchRequest',
        encodeURI(url) + qs.stringify(query, { addQueryPrefix: true }),
        init
      )
    )

    this.log('info', 'Handling request %o %o %o', [
      request.getMethod(),
      request.original.url,
      request.getHeaders()
    ])

    this._progress({
      loaded: 1,
      total: 10
    })

    request.parent = this

    request.send(body, (requestError, response) => {
      if (isError(requestError) === true) {
        this.handleError(box, data, requestError)
        return
      }

      this.handleResponse(box, data, response)
    })
  }

  auth () {
    return {}
  }

  build (box, data) {
    return {
      ...data
    }
  }

  handleError (box, data, error, status = 400) {
    this._progress({
      loaded: 1,
      total: 1
    })

    if (isString(error) === true) {
      this.fail(box, data, new Error(`${status}`))
      return
    }

    if (isPlainObject(error) === true) {
      this.fail(box, data, this.transformError(error))
      return
    }

    this.fail(box, data, error)
  }

  handleResponse (box, data, response) {
    this.log('info', 'Handling response %o %o', [
      response.getStatus(),
      response.getHeaders()
    ])

    response.parent = this

    response.decode((decodeError, object) => {
      if (isError(decodeError) === true) {
        this.handleError(box, data, decodeError)
        return
      }

      if (response.getStatus() >= 400) {
        this.handleError(box, data, object, response.getStatus())
        return
      }

      this.pass(box, data, object, response)
    }, (loaded) => {
      this._progress({
        loaded,
        total: response.getHeader('Content-Length')
      })
    })
  }

  resolveAuth (box, data, init) {
    const auth = this.resolve('auth', box, data, [init])

    if (isNil(this[auth.type]) === true) {
      return null
    }

    return this[auth.type]().setCredentials(auth)
  }
}

HttpClient.attachFactories({ authMap })
