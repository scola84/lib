import type { FastifyInstance, FastifyPluginCallback, FastifyServerOptions } from 'fastify'
import type { Server as HttpServer, IncomingMessage, ServerResponse } from 'http'
import type { Struct } from '../../../common'
import { fastify } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyFormbody from '@fastify/formbody'
import fastifyMulter from 'fastify-multer'
import fastifySse from 'fastify-sse-v2'
import type pino from 'pino'

export interface ServerOptions extends FastifyServerOptions {
  /**
   * The `fastify` address.
   *
   * @defaultValue '0.0.0.0'
   */
  address?: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: pino.Logger

  /**
   * The `fastify` plugins.
   */
  plugins?: Struct<FastifyPluginCallback>

  /**
   * The `fastify` port.
   *
   * @defaultValue 80
   */
  port?: number
}

/**
 * Manages routes.
 */
export class FastifyServer {
  /**
   * The `fastify` address.
   *
   * @defaultValue '0.0.0.0'
   */
  public address: string

  /**
   * The Fastify instance.
   *
   * @see https://www.npmjs.com/package/fastify
   */
  public fastify?: FastifyInstance

  /**
   * The `fastify` handler.
   *
   * @see https://www.npmjs.com/package/fastify
   */
  public handle?: (req: IncomingMessage, res: ServerResponse) => void

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: pino.Logger

  /**
   * The `fastify` options.
   *
   * @see https://www.npmjs.com/package/fastify
   */
  public options: FastifyServerOptions

  /**
   * The `fastify` plugins.
   *
   * @see https://www.fastify.io/docs/master/Plugins/
   */
  public plugins: Struct<FastifyPluginCallback>

  /**
   * The `fastify` port.
   *
   * @defaultValue 80
   */
  public port: number

  /**
   * The `http` server.
   *
   * @see https://nodejs.org/api/http.html#class-httpserver
   */
  public server: HttpServer

  /**
   * Creates a server.
   *
   * @param options - The server options
   */
  public constructor (options: ServerOptions = {}) {
    this.address = options.address ?? '0.0.0.0'
    this.logger = options.logger
    this.options = options
    this.port = options.port ?? 80

    this.plugins = options.plugins ?? {
      cookie: fastifyCookie,
      formbody: fastifyFormbody as FastifyPluginCallback,
      multipart: fastifyMulter.contentParser,
      sse: fastifySse
    }
  }

  /**
   * Creates a Fastify instance.
   *
   * @returns The Fastify instance
   */
  public createFastify (): FastifyInstance {
    return fastify({
      ajv: {
        customOptions: {
          allErrors: true
        }
      },
      serverFactory: (handle) => {
        this.handle = handle
        return this.server
      },
      ...this.options
    })
  }

  /**
   * Binds `fastify` to `address` and `port`
   */
  public async listen (): Promise<void> {
    await this.fastify?.listen(this.port, this.address)
  }

  /**
   * Sets `fastify` and registers `plugins`.
   */
  public async start (): Promise<void> {
    this.logger = this.logger?.child({
      name: 'server'
    })

    this.logger?.info({
      address: this.address,
      port: this.port
    }, 'Starting server')

    this.fastify = this.createFastify()

    await Promise.all(Object.values(this.plugins).map(async (plugin) => {
      await this.fastify?.register(plugin)
    }))
  }

  /**
   * Closes `fastify`.
   */
  public async stop (): Promise<void> {
    this.logger?.info('Stopping server')
    await this.fastify?.close()
    this.logger?.info('Stopped server')
  }
}
