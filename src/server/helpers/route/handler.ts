import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import { isNil, isStruct } from '../../../common'
import type { Auth } from './auth'
import type { Body } from './body'
import type { Database } from '../sql'
import type { Logger } from 'pino'
import type { RedisClientType } from 'redis'
import type { Router } from './router'
import type { Schema } from '../schema'
import { SchemaValidator } from '../schema/validator'
import type { Struct } from '../../../common'
import type { URL } from 'url'
import type { User } from '../../entities'

export interface RouteData {
  body?: unknown
  headers: IncomingHttpHeaders
  method: string
  query: Struct
  url: URL
  user?: User
}

export interface RouteHandlerOptions {
  auth: Auth
  body: Body
  database: Database
  logger: Logger
  method: string
  router: Router
  schema: Struct<Schema>
  store: RedisClientType
  url: string
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  public auth?: Auth

  public body: Body

  public database: Database

  public logger?: Logger

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

    if (handlerOptions.body === undefined) {
      throw new Error('Option "body" is undefined')
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
    this.body = handlerOptions.body
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
          response.end(this.body.format(result, response))
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

  protected async prepareRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    if (request.method === 'POST') {
      response.statusCode = 201
    }

    response.setHeader('content-type', 'application/json')

    try {
      data.body = await this.body.parse(request)
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
      response.end(this.body.format(error, response))
      throw error
    }

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
