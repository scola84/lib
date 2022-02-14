import type { FastifyReply, FastifyRequest, FastifySchema, RouteOptions, ValidationResult } from 'fastify'
import type { Database } from '../sql'
import type { FastifyServer } from './server'
import type { RedisClientType } from 'redis'
import type { Struct } from '../../../common'
import { isArray } from '../../../common'
import type pino from 'pino'

export interface FastifyHandlerOptions extends RouteOptions {
  /**
   * The database.
   *
   * @see {@link Database}
   */
  database: Database

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger: pino.Logger

  /**
   * The server.
   *
   * @see {@link Server}
   */
  server: FastifyServer

  /**
   * The store.
   *
   * @see https://preview.npmjs.com/package/redis
   */
  store: RedisClientType
}

/**
 * Handles a route.
 */
export abstract class FastifyHandler {
  /**
   * The route options.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Routes.md
   */
  public static options?: Partial<FastifyHandlerOptions>

  /**
   * The database.
   *
   * @see {@link Database}
   */
  public database?: Database

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: pino.Logger

  /**
   * The method.
   */
  public method: RouteOptions['method']

  /**
   * The route options.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Routes.md
   */
  public options: Partial<RouteOptions>

  /**
   * The pre-validation handler.
   *
   * @see https://www.fastify.io/docs/latest/Hooks/#prevalidation
   */
  public preValidation?: RouteOptions['preValidation']

  /**
   * The schema.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Validation-and-Serialization.md
   */
  public schema: FastifySchema

  /**
   * The server.
   *
   * @see {@link Server}
   */
  public server: FastifyServer

  /**
   * The store.
   *
   * @see https://www.npmjs.com/package/redis
   */
  public store?: RedisClientType

  /**
   * The URL.
   */
  public url: RouteOptions['url']

  /**
   * Creates a route handler.
   *
   * Merges the static class `options` and the constructor `options`.
   *
   * @param options - The route handler options
   * @throws `server` is undefined
   */
  public constructor (options: Partial<FastifyHandlerOptions>) {
    const handlerOptions = {
      ...FastifyHandler.options,
      ...options
    }

    if (handlerOptions.server === undefined) {
      throw new Error('Option "server" is undefined')
    }

    this.database = handlerOptions.database
    this.options = handlerOptions
    this.server = handlerOptions.server
    this.store = handlerOptions.store

    this.logger = handlerOptions.logger?.child({
      name: handlerOptions.url
    })
  }

  /**
   * Starts the route handler.
   *
   * Registers `method`, `preValidation`, `schema`, `url`, `options` and a handler on `server.fastify`.
   *
   * The registered handler calls `handle`, which has the same signature as the handler.
   *
   * The registered handler calls `handleError` if an error is caught.
   */
  public start (): void {
    this.logger?.info({
      method: this.method,
      url: this.url
    }, 'Starting route handler')

    this.server.fastify?.route({
      attachValidation: true,
      handler: this.handleRoute.bind(this),
      method: this.method,
      preValidation: this.preValidation,
      schema: this.schema,
      url: this.url,
      ...this.options
    })
  }

  /**
   * Handles an error.
   *
   * Sends a 400 reply with normalized validation results if the validation of the request failed.
   *
   * Sends a 500 reply if any other occurred.
   *
   * @param request - The request
   * @param reply - The reply
   * @param error - The error
   */
  protected async handleError (request: FastifyRequest, reply: FastifyReply, error?: unknown): Promise<void> {
    const validation = request.validationError?.validation as ValidationResult[]

    if (isArray(validation)) {
      await reply
        .status(400)
        .send(this.normalizeValidationResults(validation))

      return
    }

    await reply
      .status(500)
      .send({})

    this.logger?.error({
      context: 'handle-error'
    }, String(error))
  }

  /**
   * Handles a route.
   *
   * Calls `handle`, and `handleError` if an error is caught.
   *
   * @param request - The request
   * @param reply - The reply
   */
  protected async handleRoute (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (request.validationError !== undefined) {
        throw request.validationError
      }

      await this.handle(request, reply)
    } catch (error: unknown) {
      try {
        await this.handleError(request, reply, error)
      } catch (replyError: unknown) {
        this.logger?.error({
          context: 'handle-route'
        }, String(replyError))
      }
    }
  }

  /**
   * Normalizes validation results.
   *
   * Transforms an array of Ajv validation results into an object with key-value pairs of errors, which can be handled by {@link FormElement}.
   *
   * @param results - The raw validation results
   * @returns The normalized validation results
   *
   * @example
   * ```ts
   *[{
   *  keyword: 'type',
   *  dataPath: '.given_name',
   *  params: { type: 'number' }
   *}, {
   *  keyword: 'minLength',
   *  dataPath: '.family_name',
   *  params: { limit: 300 }
   *}]
   *```
   * becomes
   *```ts
   *{
   *  given_name: {
   *    code: 'err_input_number',
   *    data: { type: 'number' }
   *  },
   *  family_name: {
   *    code: 'err_input_minlength',
   *    data: { limit: 300 }
   *  }
   *}
   * ```
   */
  protected normalizeValidationResults (validationResults: ValidationResult[] = []): Struct {
    return validationResults.reduce<Struct>((result, validationResult) => {
      const {
        dataPath,
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

        result[dataPath.slice(1)] = {
          code: code.toLowerCase(),
          data: params
        }
      }

      return result
    }, {})
  }

  /**
   * Handles a route.
   *
   * @param request - The request
   * @param reply - The reply
   */
  public abstract handle (request: FastifyRequest, reply: FastifyReply): Promise<void>
}