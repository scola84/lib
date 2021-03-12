import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify'
import type { Logger } from 'pino'
import type { Server } from './server'

export interface RouteHandlerOptions extends RouteOptions {
  logger: Logger
  server: Server
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  public logger: Logger

  public method: RouteOptions['method']

  public options: Partial<RouteOptions>

  public server: Server

  public url: RouteOptions['url']

  public constructor (options: Partial<RouteHandlerOptions>) {
    const {
      logger,
      method,
      server,
      url
    } = {
      ...RouteHandler.options,
      ...options
    }

    if (logger === undefined) {
      throw new Error('Logger is undefined')
    }

    if (server === undefined) {
      throw new Error('Server is undefined')
    }

    if (method !== undefined) {
      this.method = method
    }

    if (url !== undefined) {
      this.url = url
    }

    this.logger = logger.child({ name: url })
    this.options = options
    this.server = server
  }

  public start (): void {
    this.logger.info({
      method: this.method,
      url: this.url
    }, 'Starting')

    this.server.fastify.route({
      ...this.options,
      handler: this.route.bind(this),
      method: this.method,
      url: this.url
    })
  }

  public abstract route (request: FastifyRequest, reply: FastifyReply): Promise<void>
}
