import type { FastifyInstance, FastifyPluginCallback, FastifyServerOptions } from 'fastify'
import type { Logger } from 'pino'
import { fastify } from 'fastify'
import fastifyCookie from 'fastify-cookie'
import fastifyFormbody from 'fastify-formbody'
import fastifyMultipart from 'fastify-multipart'

export interface ServerOptions extends FastifyServerOptions {
  /**
   * The address to bind the server to.
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
   * The port to bind the server to.
   *
   * @defaultValue 3000.
   */
  port?: number
}

/**
 * Manages the frontend routes.
 */
export class Server {
  /**
   * The address to bind `fastify` to.
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
   * A plugin to get and set cookies.
   *
   * @see https://www.npmjs.com/package/fastify-cookie
   */
  public fastifyCookie?: FastifyPluginCallback = fastifyCookie

  /**
   * A plugin to parse application/x-www-form-urlencoded content.
   *
   * @see https://www.npmjs.com/package/fastify-formbody
   */
  public fastifyFormbody?: FastifyPluginCallback = fastifyFormbody

  /**
   * A plugin to parse multipart/form-data content.
   *
   * @see https://www.npmjs.com/package/fastify-multipart
   */
  public fastifyMultipart?: FastifyPluginCallback = fastifyMultipart

  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

  /**
   * The options for the Fastify instance.
   *
   * @see https://www.npmjs.com/package/fastify
   */
  public options: FastifyServerOptions

  /**
   * The port to bind `fastify` to.
   *
   * @defaultValue 3000.
   */
  public port: number

  /**
   * Constructs a server.
   *
   * @param options - The server options
   */
  public constructor (options: ServerOptions = {}) {
    this.address = options.address ?? '0.0.0.0'
    this.logger = options.logger?.child({ name: 'server' })
    this.options = options
    this.port = options.port ?? 3000
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
   * Creates `fastify`.
   */
  public setup (): void {
    this.fastify = this.createFastify()
  }

  /**
   * Starts the server.
   *
   * Calls `setup`, registers the `plugins` and binds `fastify` to the `address` and `port`.
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

    await Promise.all([
      this.fastify?.register(this.fastifyCookie ?? (() => {})),
      this.fastify?.register(this.fastifyFormbody ?? (() => {})),
      this.fastify?.register(this.fastifyMultipart ?? (() => {})),
      this.fastify?.listen(this.port, this.address)
    ])
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
