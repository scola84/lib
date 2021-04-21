import type { FastifyReply, FastifyRequest, FastifySchema, RouteOptions } from 'fastify'
import type { Logger } from 'pino'
import type { Server } from './server'

export interface RouteHandlerOptions extends RouteOptions {
  logger: Logger
  server: Server
}

export abstract class RouteHandler {
  public static options?: Partial<RouteHandlerOptions>

  public logger?: Logger

  public method: RouteOptions['method']

  public options: Partial<RouteOptions>

  public schema: FastifySchema

  public server: Server

  public url: RouteOptions['url']

  public constructor (coptions: Partial<RouteHandlerOptions>) {
    const options = {
      ...RouteHandler.options,
      ...coptions
    }

    if (options.server === undefined) {
      throw new Error('Option "server" is undefined')
    }

    this.logger = options.logger?.child({ name: options.url })
    this.options = options
    this.server = options.server
  }

  public start (): void {
    this.logger?.info({
      method: this.method,
      url: this.url
    }, 'Starting route handler')

    this.server.fastify?.route({
      handler: this.route.bind(this),
      method: this.method,
      schema: this.schema,
      url: this.url,
      ...this.options
    })
  }

  public abstract route (request: FastifyRequest, reply: FastifyReply): Promise<void>
}