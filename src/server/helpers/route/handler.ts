import type { IncomingMessage, ServerResponse } from 'http'
import { cast, isArray, isNil, isPrimitive, isStruct, setPush } from '../../../common'
import type { Bucket } from '../file'
import type { Database } from '../sql'
import type { ErrorObject } from 'ajv'
import type { RedisClientType } from 'redis'
import type { Router } from './router'
import type { Schema } from '../schema'
import { SchemaValidator } from '../schema/validator'
import type { Struct } from '../../../common'
import type { URL } from 'url'
import busboy from 'busboy'
import { parse } from 'querystring'
import type pino from 'pino'
import { randomUUID } from 'crypto'

export interface RouteData {
  body: unknown
  headers: Struct
  query: Struct
  url: URL
  user: unknown
}

export interface RouteHandlerOptions {
  bucket: Bucket
  database: Database
  logger: pino.Logger
  method: string
  router: Router
  schema: Struct<Schema>
  store: RedisClientType
  url: string
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  public bucket?: Bucket

  public database: Database

  public logger?: pino.Logger

  public method = 'GET'

  public router: Router

  public schema: Struct<Schema>

  public store: RedisClientType

  public url: string

  public validators: Struct<SchemaValidator | undefined>

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

    this.bucket = handlerOptions.bucket
    this.database = handlerOptions.database
    this.logger = handlerOptions.logger
    this.method = handlerOptions.method ?? 'GET'
    this.router = handlerOptions.router
    this.schema = handlerOptions.schema ?? {}
    this.store = handlerOptions.store
    this.url = handlerOptions.url ?? '/'
  }

  public createValidators (): Struct<SchemaValidator> {
    return Object
      .entries(this.schema)
      .reduce<Struct<SchemaValidator>>((validators, [name, fields]) => {
      validators[name] = new SchemaValidator(fields)
      return validators
    }, {})
  }

  public async handleRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    await this.prepareRoute(data, response, request)

    try {
      const result = await Promise
        .resolve()
        .then(() => {
          return this.handle(data, response, request)
        })

      if (!response.headersSent) {
        if (isNil(result)) {
          if (
            request.method === 'GET' &&
            result === undefined
          ) {
            response.statusCode = 404
          }

          response.removeHeader('content-type')
          response.end()
        } else {
          response.end(this.formatBody(result, response))
        }
      }
    } catch (error: unknown) {
      response.statusCode = 500
      response.removeHeader('content-type')
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

    this.validators = this.createValidators()
    this.router.register(this.method, this.url, this)
  }

  protected authenticate (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<unknown>

  protected async authenticate (): Promise<unknown> {
    return Promise.resolve(null)
  }

  protected authorize (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void>

  protected async authorize (): Promise<void> {
    return Promise.resolve()
  }

  protected formatBody (data: unknown, response?: ServerResponse): string {
    let body = ''

    const [contentType] = response
      ?.getHeader('content-type')
      ?.toString()
      .split(';') ?? []

    switch (contentType) {
      case 'application/json':
        body = this.formatBodyJson(data)
        break
      case 'text/event-stream':
        body = this.formatBodyEventStream(data)
        break
      case 'text/html':
        body = String(data)
        break
      default:
        break
    }

    if (response?.headersSent === false) {
      response.setHeader('content-length', body.length.toString())
    }

    return body
  }

  protected formatBodyEventStream (data: unknown): string {
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

  protected formatBodyJson (data: unknown): string {
    return JSON.stringify(data)
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

  protected async parseBody (request: IncomingMessage): Promise<unknown> {
    let body: unknown = null

    const [contentType] = request.headers['content-type']?.split(';') ?? []

    switch (contentType) {
      case 'application/json':
        body = await this.parseBodyJson(request)
        break
      case 'application/x-www-form-urlencoded':
        body = await this.parseBodyFormUrlencoded(request)
        break
      case 'multipart/form-data':
        body = await this.parseBodyFormData(request)
        break
      case 'application/octet-stream':
        body = await this.parseBodyOctetStream(request)
        break
      case 'text/plain':
        body = await this.parseBodyPlain(request)
        break
      default:
        break
    }

    return body
  }

  protected async parseBodyFormData (request: IncomingMessage): Promise<Struct> {
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
        setPush(body, name, cast(value))
      })

      parser.on('file', (name, stream, info) => {
        const file = {
          id: randomUUID(),
          name: info.filename,
          size: 0,
          type: info.mimeType
        }

        setPush(body, name, file)

        stream.on('data', (data) => {
          if (Buffer.isBuffer(data)) {
            file.size += data.length
          }
        })

        this.bucket?.put(file.id, stream)
      })

      parser.on('close', () => {
        parser.removeAllListeners()
        parser.destroy()
        resolve(body)
      })

      request.pipe(parser)
    })
  }

  protected parseBodyFormDataField (body: Struct, name: string, value: string): void {
    const castValue = cast(value)

    if (body[name] === undefined) {
      body[name] = castValue
    } else {
      let bodyValue = body[name]

      if (!isArray(bodyValue)) {
        body[name] = [body[name]]
        bodyValue = body[name]
      }

      if (isArray(bodyValue)) {
        bodyValue.push(castValue)
      }
    }
  }

  protected async parseBodyFormUrlencoded (request: IncomingMessage): Promise<Struct> {
    return {
      ...parse(await this.parseBodyPlain(request))
    }
  }

  protected async parseBodyJson (request: IncomingMessage): Promise<unknown> {
    return JSON.parse(await this.parseBodyPlain(request)) as unknown
  }

  protected async parseBodyOctetStream (request: IncomingMessage): Promise<Buffer> {
    let body = Buffer.from([])

    for await (const data of request) {
      if (Buffer.isBuffer(data)) {
        body = Buffer.concat([body, data])
      }
    }

    return body
  }

  protected async parseBodyPlain (request: IncomingMessage): Promise<string> {
    let body = ''

    for await (const data of request) {
      body += String(data)
    }

    return body
  }

  protected async prepareRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    if (request.method === 'POST') {
      response.statusCode = 201
    }

    response.setHeader('content-type', 'application/json')

    try {
      data.body = await this.parseBody(request)
    } catch (error: unknown) {
      response.statusCode = 415
      response.removeHeader('content-type')
      response.end()
      throw error
    }

    try {
      this.validateData(data)
    } catch (error: unknown) {
      response.statusCode = 400
      response.end(this.formatBody(error, response))
      throw error
    }

    try {
      data.user = await this.authenticate(data, response, request)
    } catch (error: unknown) {
      response.statusCode = 401
      response.removeHeader('content-type')
      response.end()
      throw error
    }

    try {
      await this.authorize(data, response, request)
    } catch (error: unknown) {
      response.statusCode = 403
      response.removeHeader('content-type')
      response.end()
      throw error
    }
  }

  protected validate<Data extends Struct = Struct>(name: string, data: Data): Data {
    if (this.validators[name] === undefined) {
      throw new Error(`Schema "${name}" is undefined`)
    }

    const errors = this.validators[name]?.validate(data)

    if (!isNil(errors)) {
      throw errors as unknown as Error
    }

    return data
  }

  protected validateData (data: RouteData): void {
    if (this.validators.body !== undefined) {
      if (isStruct(data.body)) {
        this.validate('body', data.body)
      } else {
        this.validate('body', {})
      }
    }

    if (this.validators.headers !== undefined) {
      this.validate('headers', data.headers)
    }

    if (this.validators.query !== undefined) {
      this.validate('query', data.query)
    }
  }

  protected abstract handle (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<unknown> | unknown
}
