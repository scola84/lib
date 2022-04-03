import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import type { FileBucket } from '../file'
import type { Logger } from 'pino'
import type { RedisClientType } from 'redis'
import type { RouteAuth } from './auth'
import type { RouteCodec } from './codec'
import type { Router } from './router'
import type { Schema } from '../schema'
import { SchemaValidator } from '../schema/validator'
import type { SqlDatabase } from '../sql'
import type { Struct } from '../../../common'
import type { URL } from 'url'
import type { User } from '../../entities'
import { isNil } from '../../../common'

export interface RouteData extends Struct {
  body?: unknown
  headers: IncomingHttpHeaders
  method: string
  query: Struct
  url: URL
  user?: User
}

export interface RouteHandlerOptions {
  auth: RouteAuth
  bucket: FileBucket
  codec: RouteCodec
  database: SqlDatabase
  description: string
  logger: Logger
  method: string
  router: Router
  schema: Schema
  store: RedisClientType
  url: string
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  public auth?: RouteAuth

  public bucket?: FileBucket

  public codec: RouteCodec

  public database: SqlDatabase

  public description?: string

  public logger?: Logger

  public method = 'GET'

  public router: Router

  public schema: Partial<Schema> = {}

  public store: RedisClientType

  public url: string

  public validator: SchemaValidator

  public constructor (options?: Partial<RouteHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.codec === undefined) {
      throw new Error('Option "codec" is undefined')
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

    this.auth = handlerOptions.auth
    this.bucket = handlerOptions.bucket
    this.codec = handlerOptions.codec
    this.database = handlerOptions.database
    this.description = handlerOptions.description
    this.logger = handlerOptions.logger
    this.method = handlerOptions.method ?? 'GET'
    this.router = handlerOptions.router
    this.schema = handlerOptions.schema ?? {}
    this.store = handlerOptions.store
    this.url = handlerOptions.url ?? '/'
  }

  public async handleRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    await this.prepareRoute(data, response, request)

    try {
      const result = await Promise
        .resolve()
        .then(() => {
          return this.handle(data, response, request)
        })

      if (isNil(result)) {
        if (result === undefined) {
          response.removeHeader('content-type')
          response.end()
        }
      } else {
        response.end(this.codec.encode(result, response))
      }
    } catch (error: unknown) {
      if (response.statusCode < 300) {
        response.statusCode = 500
      }

      response.removeHeader('content-type')
      response.end()
      throw error
    }
  }

  public async prepareRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    response.setHeader('content-type', 'application/json')

    try {
      data.user = await this.auth?.authenticate(data)
    } catch (error: unknown) {
      await this.auth?.logout(data, response)
      response.statusCode = 401
      response.removeHeader('content-type')
      response.end()
      throw error
    }

    try {
      this.auth?.authorize(data)
    } catch (error: unknown) {
      await this.auth?.logout(data, response)
      response.statusCode = 403
      response.removeHeader('content-type')
      response.end()
      throw error
    }

    try {
      data.body = await this.codec.decode(request, this.schema.body?.schema)
    } catch (error: unknown) {
      response.statusCode = 415
      response.removeHeader('content-type')
      response.end()
      throw error
    }

    try {
      this.validator.validate(data, data.user)
    } catch (error: unknown) {
      response.statusCode = 400
      response.end(this.codec.encode(error, response))
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
    this.router.register(this.method, this.url, this)
  }

  public stop (): Promise<void> | void {}

  public abstract handle (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<unknown> | unknown
}
