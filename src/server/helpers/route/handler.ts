import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import type { Struct, User } from '../../../common'
import { isNil, toString } from '../../../common'
import type { FileBucket } from '../file'
import type { Logger } from 'pino'
import type { RedisClientType } from 'redis'
import type { RouteAuth } from './auth'
import type { RouteCodec } from './codec'
import type { Router } from './router'
import type { Schema } from '../schema'
import { SchemaValidator } from '../schema/validator'
import type { Sms } from '../sms'
import type { Smtp } from '../smtp'
import type { SqlDatabase } from '../sql'
import type { URL } from 'url'

export interface RouteData extends Struct {
  body?: unknown
  headers: IncomingHttpHeaders
  ip: string
  method: string
  query: Struct
  url: URL
  user?: User
}

export interface RouteHandlerOptions {
  auth: RouteAuth
  authenticate: boolean
  authorize: boolean
  bucket: FileBucket
  codec: RouteCodec
  database: SqlDatabase
  decode: boolean
  description: string
  logger: Logger
  method: string
  origin: string
  permit: Struct
  router: Router
  schema: Schema
  sms: Sms
  smtp: Smtp
  store: RedisClientType
  url: string
  validate: boolean
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  public auth?: RouteAuth

  public authenticate: boolean

  public authorize: boolean

  public bucket?: FileBucket

  public codec: RouteCodec

  public database?: SqlDatabase

  public decode: boolean

  public description?: string

  public logger?: Logger

  public method: string

  public origin: string

  public permit?: Struct

  public router: Router

  public schema: Partial<Schema>

  public sms?: Sms

  public smtp?: Smtp

  public store?: RedisClientType

  public url: string

  public validate: boolean

  public validator: SchemaValidator

  public constructor (options?: Partial<RouteHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.codec === undefined) {
      throw new Error('Option "codec" is undefined')
    }

    if (handlerOptions.router === undefined) {
      throw new Error('Option "router" is undefined')
    }

    this.auth = handlerOptions.auth
    this.authenticate = handlerOptions.authenticate ?? true
    this.authorize = handlerOptions.authorize ?? true
    this.bucket = handlerOptions.bucket
    this.codec = handlerOptions.codec
    this.database = handlerOptions.database
    this.decode = handlerOptions.decode ?? true
    this.description = handlerOptions.description
    this.logger = handlerOptions.logger
    this.method = handlerOptions.method ?? 'GET'
    this.origin = handlerOptions.origin ?? process.env.ORIGIN ?? ''
    this.permit = handlerOptions.permit
    this.router = handlerOptions.router
    this.schema = handlerOptions.schema ?? {}
    this.sms = handlerOptions.sms
    this.smtp = handlerOptions.smtp
    this.store = handlerOptions.store
    this.url = handlerOptions.url ?? '/'
    this.validate = handlerOptions.validate ?? true
  }

  public async handleRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    try {
      if (this.authenticate) {
        data.user = await this.auth?.authenticate(data, response)
      }

      if (this.authorize) {
        this.auth?.authorize(data, response, this.permit)
      }

      if (this.decode) {
        try {
          data.body = await this.codec.decode(request, this.schema.body?.schema)
        } catch (error: unknown) {
          response.statusCode = 415
          throw error
        }
      }

      if (this.validate) {
        try {
          await this.validator.validate(data, data.user)
        } catch (error: unknown) {
          response.statusCode = 400
          response.end(this.codec.encode(error, response, request))
          throw error
        }
      }

      const result = await this.handle(data, response, request)

      if (!response.headersSent) {
        if (isNil(result)) {
          if (result === undefined) {
            response.removeHeader('content-type')
            response.end()
          }
        } else {
          response.end(this.codec.encode(result, response, request))
        }
      }
    } catch (error: unknown) {
      if (!response.headersSent) {
        if (response.statusCode === 401) {
          await this.auth?.setBackoff(data, response)
        } else {
          if (response.statusCode < 300) {
            response.statusCode = 500
          }

          response.removeHeader('content-type')
          response.end()
        }
      }

      this.logger?.error({
        context: 'handle-route',
        status: response.statusCode
      }, toString(error))

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

    this.validator = new SchemaValidator(this.schema as Schema)

    this.validator
      .compile()
      .then(() => {
        this.router.register(this.method, this.url, this)
      })
      .catch((error: unknown) => {
        this.logger?.error({
          context: 'start'
        }, toString(error))
      })
  }

  public stop (): Promise<void> | void {}

  public abstract handle (data: RouteData, response: ServerResponse, request: IncomingMessage): unknown
}
