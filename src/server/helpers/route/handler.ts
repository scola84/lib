import type { IncomingMessage, ServerResponse } from 'http'
import { isNil, isPrimitive, isStruct } from '../../../common'
import Ajv from 'ajv'
import type { Database } from '../sql'
import type { ErrorObject } from 'ajv'
import type { ObjectSchema } from 'fluent-json-schema'
import type { RedisClientType } from 'redis'
import type { Router } from './router'
import type { Struct } from '../../../common'
import type { URL } from 'url'
import busboy from 'busboy'
import { createWriteStream } from 'fs'
import { parse } from 'querystring'
import type pino from 'pino'
import { randomUUID } from 'crypto'

export interface RouteData {
  body?: unknown
  headers: Struct
  query: Struct
  url: URL
  user?: unknown
}

export interface RouteHandlerOptions {
  database: Database
  dir: string
  logger?: pino.Logger
  method: string
  requestType: string
  responseType: string
  router: Router
  schema: Struct<ObjectSchema | undefined>
  store: RedisClientType
  url: string
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  public database: Database

  public dir: string

  public logger?: pino.Logger

  public method = 'GET'

  public requestType?: string

  public responseType?: string

  public router: Router

  public schema: Struct<ObjectSchema | undefined>

  public store: RedisClientType

  public url: string

  public validator: Ajv

  public constructor (options?: Partial<RouteHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (handlerOptions.router === undefined) {
      throw new Error('Option "router" is undefined')
    }

    if (handlerOptions.store === undefined) {
      throw new Error('Option "store" is undefined')
    }

    this.database = handlerOptions.database
    this.dir = handlerOptions.dir ?? '/tmp'
    this.logger = handlerOptions.logger
    this.method = handlerOptions.method ?? 'GET'
    this.requestType = handlerOptions.requestType
    this.responseType = handlerOptions.responseType
    this.router = handlerOptions.router
    this.schema = handlerOptions.schema ?? {}
    this.store = handlerOptions.store
    this.url = handlerOptions.url ?? '/'
  }

  public createValidator (): Ajv {
    const validator = new Ajv({
      allErrors: true,
      coerceTypes: true,
      useDefaults: true
    })

    Object
      .entries(this.schema)
      .forEach(([name, schema]) => {
        if (schema !== undefined) {
          validator.addSchema(schema.valueOf(), name)
        }
      })

    return validator
  }

  public async handleRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    await this.prepareRoute(data, response, request)

    try {
      if (request.method === 'POST') {
        response.statusCode = 201
      }

      const result = await this.handle(data, response, request)

      if (isNil(result)) {
        if (result === null) {
          response.end()
        }
      } else {
        response.end(this.stringify(result, response))
      }
    } catch (error: unknown) {
      response.statusCode = 500
      response.end()
      throw error
    }
  }

  public start (): void {
    this.logger = this.logger?.child({
      name: `${this.method} ${this.url}`
    })

    this.logger?.info({
      method: this.method,
      url: this.url
    }, 'Starting route handler')

    this.validator = this.createValidator()
    this.router.registerHandler(this.method, this.url, this)
  }

  protected authenticate (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<unknown>

  protected async authenticate (): Promise<unknown> {
    return Promise.resolve(undefined)
  }

  protected authorize (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void>

  protected async authorize (): Promise<void> {
    return Promise.resolve(undefined)
  }

  protected normalizeErrors (errors: ErrorObject[] = []): Struct {
    return errors.reduce<Struct>((result, validationResult) => {
      const {
        instancePath,
        keyword,
        params
      } = validationResult

      if (keyword === 'required') {
        result[String(params.missingProperty)] = {
          code: 'err_input_required'
        }
      } else {
        let code = `err_input_${keyword}`

        if (keyword === 'type') {
          code = `err_input_${String(params[keyword])}`
        }

        result[instancePath.slice(1)] = {
          code: code.toLowerCase(),
          data: params
        }
      }

      return result
    }, {})
  }

  protected async parse (request: IncomingMessage): Promise<unknown> {
    let body: unknown = null

    switch (this.requestType) {
      case 'application/json':
        body = await this.parseJson(request)
        break
      case 'application/x-www-form-urlencoded':
        body = await this.parseFormUrlencoded(request)
        break
      case 'multipart/form-data':
        body = await this.parseFormData(request)
        break
      case 'application/octet-stream':
        body = await this.parseOctetStream(request)
        break
      case 'text/plain':
        body = await this.parsePlain(request)
        break
      default:
        break
    }

    return body
  }

  protected async parseFormData (request: IncomingMessage): Promise<Struct> {
    return new Promise((resolve, reject) => {
      const body: Struct = {}

      const parser = busboy({
        headers: request.headers
      })

      parser.on('error', (error) => {
        parser.removeAllListeners()
        parser.destroy()
        reject(error)
      })

      parser.on('field', (name, value) => {
        body[name] = value
      })

      parser.on('file', (name, file, info) => {
        const data = {
          name: info.filename,
          size: 0,
          tmpname: `${this.dir}/${randomUUID()}`,
          type: info.mimeType
        }

        file.on('data', (chunk) => {
          if (Buffer.isBuffer(chunk)) {
            data.size += chunk.length
          }
        })

        body[name] = data
        file.pipe(createWriteStream(data.tmpname))
      })

      parser.on('close', () => {
        parser.removeAllListeners()
        parser.destroy()
        resolve(body)
      })

      request.pipe(parser)
    })
  }

  protected async parseFormUrlencoded (request: IncomingMessage): Promise<Struct> {
    return { ...parse(await this.parsePlain(request)) }
  }

  protected async parseJson (request: IncomingMessage): Promise<unknown> {
    return JSON.parse(await this.parsePlain(request)) as unknown
  }

  protected async parseOctetStream (request: IncomingMessage): Promise<Buffer> {
    let body = Buffer.from([])

    for await (const buffer of request) {
      if (Buffer.isBuffer(buffer)) {
        body = Buffer.concat([body, buffer])
      }
    }

    return body
  }

  protected async parsePlain (request: IncomingMessage): Promise<string> {
    let body = ''

    for await (const string of request) {
      body += String(string)
    }

    return body
  }

  protected async prepareRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    try {
      data.body = await this.parse(request)
    } catch (error: unknown) {
      response.statusCode = 400
      response.end()
      throw error
    }

    try {
      if (this.schema.body !== undefined) {
        this.validate('body', data.body)
      }

      if (this.schema.headers !== undefined) {
        this.validate('headers', data.headers)
      }

      if (this.schema.query !== undefined) {
        this.validate('query', data.query)
      }
    } catch (error: unknown) {
      response.statusCode = 400
      response.end(this.stringify(error, response))
      throw error
    }

    try {
      data.user = await this.authenticate(data, response, request)
    } catch (error: unknown) {
      response.statusCode = 401
      response.end()
      throw error
    }

    try {
      await this.authorize(data, response, request)
    } catch (error: unknown) {
      response.statusCode = 403
      response.end()
      throw error
    }
  }

  protected stringify (data: unknown, response?: ServerResponse): string {
    let body = ''

    switch (this.responseType) {
      case 'application/json':
        body = this.stringifyJson(data)
        break
      case 'text/event-stream':
        body = this.stringifyEventStream(data)
        break
      case 'text/html':
        body = String(data)
        break
      default:
        break
    }

    if (response?.headersSent === false) {
      response.setHeader('content-length', body.length.toString())
      response.setHeader('content-type', this.responseType ?? '')
    }

    return body
  }

  protected stringifyEventStream (data: unknown): string {
    let body = ''

    if (isStruct(data)) {
      if (isPrimitive(data.data)) {
        body += `data: ${data.data.toString()}\n`
      }

      if (isPrimitive(data.event)) {
        body += `event: ${data.event.toString()}\n`
      }

      if (isPrimitive(data.id)) {
        body += `id: ${data.id.toString()}\n`
      }

      if (isPrimitive(data.retry)) {
        body += `retry: ${data.retry.toString()}\n`
      }
    }

    if (body.length === 0) {
      return ''
    }

    return `${body}\n`
  }

  protected stringifyJson (data: unknown): string {
    return JSON.stringify(data)
  }

  protected validate<Data = Struct>(name: string, data: Data): Data {
    const schema = this.validator.getSchema(name)

    if (schema === undefined) {
      throw new Error(`Schema "${name}" is undefined`)
    }

    if (schema(data) === false) {
      throw this.normalizeErrors(schema.errors ?? undefined) as unknown as Error
    }

    return data
  }

  protected abstract handle (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<unknown> | unknown
}
