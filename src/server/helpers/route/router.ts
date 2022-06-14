import type { IncomingMessage, Server, ServerResponse } from 'http'
import { ScolaError, Struct, isError, isNil, toString } from '../../../common'
import type { Logger } from 'pino'
import type { RouteCodec } from './codec'
import type { RouteHandler } from './handler'
import { URL } from 'url'
import { createServer } from 'http'
import { parse as parseCookie } from 'cookie'

export interface RouterOptions {
  address?: string
  codec?: RouteCodec
  logger?: Logger
  port?: number
}

export class Router {
  public address: string

  public codec: RouteCodec

  public fastify?: (req: IncomingMessage, res: ServerResponse) => void

  public handlers: Map<string, Map<string, RouteHandler>> = new Map()

  public logger?: Logger

  public port: number

  public server?: Server

  public constructor (options: RouterOptions = {}) {
    if (options.codec === undefined) {
      throw new Error('Option "codec" is undefined')
    }

    this.address = options.address ?? '0.0.0.0'
    this.codec = options.codec
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
              response.removeHeader('content-type')
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
        throw new ScolaError({
          code: 'err_router',
          message: 'Path is undefined',
          status: 404
        })
      } else {
        this.fastify(request, response)
        return
      }
    }

    const handler = handlers.get(request.method ?? '')

    if (handler === undefined) {
      response.setHeader('allow', Array.from(handlers.keys()).join(','))
      throw new ScolaError({
        code: 'err_router',
        message: 'Method is undefined',
        status: 405
      })
    }

    const data = {
      cookies: parseCookie(request.headers.cookie ?? ''),
      headers: request.headers,
      ip: request.headers['x-real-ip']?.toString() ?? request.socket.remoteAddress,
      method: request.method ?? 'GET',
      query: Struct.fromQuery(url.searchParams.toString(), true),
      url: url
    }

    try {
      const result = await handler.handleRoute(data, response, request)

      if (!response.headersSent) {
        if (isNil(result)) {
          if (result === undefined) {
            response.removeHeader('content-type')
            response.end()
          }
        } else {
          response.end(this.codec.encode(result, response, request))
        }
      }
    } catch (error: unknown) {
      if (!response.headersSent) {
        if (isError(error)) {
          response.statusCode = error.status ?? 500
          response.end(this.codec.encode(error, response, request))
        } else {
          throw error
        }
      }

      this.logger?.error({
        context: 'handle-route',
        status: response.statusCode
      }, toString(error))
    }
  }
}
