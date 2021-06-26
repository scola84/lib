import type { FastifyReply, FastifyRequest, FastifySchema, RouteOptions } from 'fastify'
import type { Logger } from 'pino'
import type { Server } from './server'

export interface RouteHandlerOptions extends RouteOptions {
  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger: Logger

  /**
   * The server.
   *
   * @see {@link Server}
   */
  server: Server
}

/**
 * Handles a route.
 */
export abstract class RouteHandler {
  /**
   * The route options.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Routes.md
   */
  public static options?: Partial<RouteHandlerOptions>

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

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
  public server: Server

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
   * @throws server is undefined
   */
  public constructor (options: Partial<RouteHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.server === undefined) {
      throw new Error('Option "server" is undefined')
    }

    this.logger = handlerOptions.logger?.child({ name: handlerOptions.url })
    this.options = handlerOptions
    this.server = handlerOptions.server
  }

  /**
   * Starts the route handler.
   *
   * Registers `method`, `url`, `schema`, `options` and a handler on `server.fastify`.
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
      handler: this.handleRoute.bind(this),
      method: this.method,
      schema: this.schema,
      url: this.url,
      ...this.options
    })
  }

  /**
   * Handles an error.
   *
   * Sends a 500 reply to the client if a reply has not yet been sent.
   *
   * @param reply - The reply
   * @param error - The error
   */
  protected async handleError (reply: FastifyReply, error: unknown): Promise<void> {
    this.logger?.error({ context: 'handle-error' }, String(error))

    if (!reply.sent) {
      await reply
        .status(500)
        .send(new Error('Internal Server Error'))
    }
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
      await this.handle(request, reply)
    } catch (error: unknown) {
      try {
        await this.handleError(reply, error)
      } catch (replyError: unknown) {
        this.logger?.error({ context: 'handle-route' }, String(replyError))
      }
    }
  }

  /**
   * Handles a route.
   *
   * @param request - The request
   * @param reply - The reply
   */
  public abstract handle (request: FastifyRequest, reply: FastifyReply): Promise<void>
}
