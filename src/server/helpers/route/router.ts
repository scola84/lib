import type { IncomingMessage, Server, ServerResponse } from 'http'
import type { RouteHandler } from './handler'
import { URL } from 'url'
import { createServer } from 'http'
import type pino from 'pino'

export interface RouterOptions {
  address?: string
  logger?: pino.Logger
  port?: number
}

export class Router {
  public address: string

  public fastify?: (req: IncomingMessage, res: ServerResponse) => void

  public handlers: Map<string, RouteHandler> = new Map()

  public logger?: pino.Logger

  public port: number

  public server?: Server

  public constructor (options: RouterOptions = {}) {
    this.address = options.address ?? '0.0.0.0'
    this.logger = options.logger
    this.port = options.port ?? 80
  }

  public register (method: string, url: string, handler: RouteHandler): void {
    this.handlers.set(`${method} ${url}`, handler)
  }

  public setup (): void {
    this.logger = this.logger?.child({
      name: 'router'
    })

    this.server = createServer((request, response) => {
      this
        .handleRoute(request, response)
        .catch((error: unknown) => {
          this.logger?.error({
            context: 'setup'
          }, String(error))
        })
    })
  }

  public start (setup = true): void {
    if (setup) {
      this.setup()
    }

    this.logger?.info({
      address: this.address,
      port: this.port
    }, 'Starting router')

    this.server?.listen(this.port, this.address)
  }

  public stop (): void {
    this.logger?.info('Stopping server')
    this.server?.close()
  }

  protected async handleRoute (request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '', `http://${request.headers.host ?? 'localhost'}`)
    const route = `${request.method ?? ''} ${url.pathname}`
    const handler = this.handlers.get(route)

    if (handler === undefined) {
      if (this.fastify === undefined) {
        response.statusCode = 404
        response.end()
        throw new Error(`Route "${route}" not found`)
      } else {
        this.fastify(request, response)
      }
    } else {
      await handler.handleRoute({
        body: null,
        headers: request.headers,
        query: Object.fromEntries(url.searchParams),
        url
      }, response, request)
    }
  }
}
