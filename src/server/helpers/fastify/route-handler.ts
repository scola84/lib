import type { FastifyReply, FastifyRequest, FastifySchema, RouteOptions } from 'fastify'
import type { Logger } from 'pino'
import type { Server } from './server'

export interface RouteHandlerOptions extends RouteOptions {
  logger: Logger
  server: Server
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  /**
   * The logger.
   */
  public logger?: Logger

  /**
   * The method of the route.
   */
  public method: RouteOptions['method']

  /**
   * The options for the Fastify route.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Routes.md
   */
  public options: Partial<RouteOptions>

  /**
   * The schema of the route.
   *
   * @see https://github.com/fastify/fastify/blob/main/docs/Validation-and-Serialization.md
   */
  public schema: FastifySchema

  /**
   * The server.
   */
  public server: Server

  /**
   * The URL of the route.
   */
  public url: RouteOptions['url']

  /**
   * Constructs a route handler.
   *
   * Merges the static class `options` and the constructor `options`.
   *
   * @param options - The route options
   * @throws server is undefined
   */
  public constructor (options: Partial<RouteHandlerOptions>) {
    const routeOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (routeOptions.server === undefined) {
      throw new Error('Option "server" is undefined')
    }

    this.logger = routeOptions.logger?.child({ name: routeOptions.url })
    this.options = routeOptions
    this.server = routeOptions.server
  }

  /**
   * Starts the route handler.
   *
   * Registers the `method`, `url`, `schema` and a handler on the `fastify` instance of the `server`.
   *
   * The registered handler calls the `route` method of this class, which has the same signature as the handler.
   *
   * Sends a 500 response to the client if an error is thrown and a response has not yet been sent.
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
   * Sends a 500 response to the client if a response has not yet been sent.
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
   * Calls `route` and `handleError` is an error is thrown.
   *
   * @param request - The request
   * @param reply - The reply
   */
  protected async handleRoute (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      await this.route(request, reply)
    } catch (error: unknown) {
      try {
        await this.handleError(reply, error)
      } catch (replyError: unknown) {
        this.logger?.error({ context: 'handle-route' }, String(replyError))
      }
    }
  }

  /**
   * Performs the business logic.
   *
   * @param request - The request
   * @param reply - The reply
   */
  public abstract route (request: FastifyRequest, reply: FastifyReply): Promise<void>
}
