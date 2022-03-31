import type { IncomingMessage, Server, ServerResponse } from 'http'
import type { Logger } from 'pino'
import type { RouteHandler } from './handler'
import { Struct } from '../../../common'
import { URL } from 'url'
import { createServer } from 'http'

export interface RouterOptions {
  address?: string
  logger?: Logger
  port?: number
}

export class Router {
  public address: string

  public fastify?: (req: IncomingMessage, res: ServerResponse) => void

  public handlers: Map<string, Map<string, RouteHandler>> = new Map()

  public logger?: Logger

  public port: number

  public server?: Server

  public constructor (options: RouterOptions = {}) {
    this.address = options.address ?? '0.0.0.0'
    this.logger = options.logger
    this.port = options.port ?? 80
  }

  public register (method: string, url: string, handler: RouteHandler): void {
    let handlers = this.handlers.get(url)

    if (handlers === undefined) {
      handlers = new Map()
      this.handlers.set(url, handlers)
    }

    handlers.set(method, handler)
  }

  public async start (listen = true): Promise<void> {
    return new Promise((resolve) => {
      this.logger = this.logger?.child({
        name: 'router'
      })

      this.logger?.info({
        address: this.address,
        port: this.port
      }, 'Starting router')

      this.server = createServer((request, response) => {
        this
          .handleRoute(request, response)
          .catch((error: unknown) => {
            this.logger?.error({
              context: 'handle-route'
            }, String(error))
          })
      })

      if (listen) {
        this.server.listen(this.port, this.address, resolve)
      } else {
        resolve()
      }
    })
  }

  public async stop (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger?.info('Stopping server')

      this.server?.close((error) => {
        if (error === undefined) {
          resolve()
        } else {
          reject(error)
        }
      })
    })
  }

  protected async handleRoute (request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '', `http://${request.headers.host ?? 'localhost'}`)
    const handlers = this.handlers.get(url.pathname)

    if (handlers === undefined) {
      if (this.fastify === undefined) {
        response.statusCode = 404
        response.end()
        throw new Error(`Path "${url.pathname}" not found`)
      } else {
        this.fastify(request, response)
      }
    } else {
      const handler = handlers.get(request.method ?? '')

      if (handler === undefined) {
        response.statusCode = 405
        response.setHeader('allow', Array.from(handlers.keys()).join(','))
        response.end()
        throw new Error(`Method "${request.method ?? ''} ${url.pathname}" not allowed`)
      } else {
        await handler.handleRoute({
          headers: request.headers,
          method: request.method ?? 'GET',
          query: Struct.fromString(decodeURI(url.search), true),
          url: url
        }, response, request)
      }
    }
  }
}
