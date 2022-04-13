import type { IncomingMessage, Server, ServerResponse } from 'http'
import { Struct, toString } from '../../../common'
import type { Logger } from 'pino'
import type { RouteHandler } from './handler'
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
    this.logger = this.logger?.child({
      name: 'router'
    })

    this.logger?.info({
      address: this.address,
      port: this.port
    }, 'Starting router')

    return new Promise((resolve) => {
      this.server = createServer((request, response) => {
        this
          .handleRoute(request, response)
          .catch((error: unknown) => {
            if (!response.headersSent) {
              response.statusCode = 500
              response.end()
            }

            this.logger?.error({
              context: 'handle-route',
              status: response.statusCode
            }, toString(error))
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
    this.logger?.info({
      handlers: this.handlers.size,
      listening: this.server?.listening
    }, 'Stopping router')

    await Promise.all(Array
      .from(this.handlers.values())
      .map((handlers) => {
        return Array
          .from(handlers.values())
          .map((handler) => {
            return handler.stop()
          })
      })
      .flat())

    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => {
        if (error === undefined) {
          resolve()
        } else {
          reject(error)
        }
      })
    })

    this.logger?.info('Stopped router')
  }

  protected async handleRoute (request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '', `http://${request.headers.host ?? 'localhost'}`)
    const handlers = this.handlers.get(url.pathname)

    if (handlers === undefined) {
      if (this.fastify === undefined) {
        response.statusCode = 404
        response.end()
        throw new Error('Path not found')
      } else {
        this.fastify(request, response)
        return
      }
    }

    const handler = handlers.get(request.method ?? '')

    if (handler === undefined) {
      response.statusCode = 405
      response.setHeader('allow', Array.from(handlers.keys()).join(','))
      response.end()
      throw new Error('Method not allowed')
    }

    const ip = request.headers['x-real-ip']?.toString() ?? request.socket.remoteAddress

    if (ip === undefined) {
      throw new Error('IP is undefined')
    }

    const data = {
      headers: request.headers,
      ip: ip,
      method: request.method ?? 'GET',
      query: Struct.fromQuery(url.searchParams.toString(), true),
      url: url
    }

    await handler.handleRoute(data, response, request)
  }
}
