import type { FastifyInstance, FastifyPluginCallback, FastifyServerOptions } from 'fastify'
import type { Logger } from 'pino'
import { fastify } from 'fastify'
import fastifyCookie from 'fastify-cookie'
import fastifyFormbody from 'fastify-formbody'
import fastifyMultipart from 'fastify-multipart'

export interface ServerOptions extends FastifyServerOptions {
  /**
   * The `fastify` address.
   *
   * @defaultValue '0.0.0.0'.
   */
  address?: string

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: Logger

  /**
   * The `fastify` plugins.
   */
  plugins?: Record<string, FastifyPluginCallback>

  /**
   * The `fastify` port.
   *
   * @defaultValue 3000.
   */
  port?: number
}

/**
 * Manages routes.
 */
export class Server {
  /**
   * The `fastify` address.
   *
   * @defaultValue '0.0.0.0'.
   */
  public address: string

  /**
   * The Fastify instance.
   *
   * @see https://www.npmjs.com/package/fastify
   */
  public fastify?: FastifyInstance

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

  /**
   * The `fastify` options.
   *
   * @see https://www.npmjs.com/package/fastify
   */
  public options: FastifyServerOptions

  /**
   * The `fastify` plugins.
   */
  public plugins: Record<string, FastifyPluginCallback>

  /**
   * The `fastify` port.
   *
   * @defaultValue 3000
   */
  public port: number

  /**
   * Creates a server.
   *
   * @param options - The server options
   */
  public constructor (options: ServerOptions = {}) {
    this.address = options.address ?? '0.0.0.0'
    this.logger = options.logger?.child({ name: 'server' })
    this.options = options
    this.port = options.port ?? 3000

    this.plugins = options.plugins ?? {
      cookie: fastifyCookie,
      formbody: fastifyFormbody,
      multipart: fastifyMultipart
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
      ...this.options
    })
  }

  /**
   * Sets up the server.
   *
   * Sets `fastify`.
   */
  public setup (): void {
    this.fastify = this.createFastify()
  }

  /**
   * Starts the server.
   *
   * Calls `setup`, registers `plugins` and binds `fastify` to `address` and `port`.
   *
   * @param setup - Whether to call `setup`
   */
  public async start (setup = true): Promise<void> {
    this.logger?.info({
      address: this.address,
      port: this.port
    }, 'Starting server')

    if (setup) {
      this.setup()
    }

    await Promise.all(Object.values(this.plugins).map((plugin) => {
      return this.fastify?.register(plugin)
    }))

    await this.fastify?.listen(this.port, this.address)
  }

  /**
   * Stops the server.
   *
   * Closes `fastify`.
   */
  public async stop (): Promise<void> {
    this.logger?.info({
      address: this.address,
      port: this.port
    }, 'Stopping server')

    await this.fastify?.close()
  }
}
