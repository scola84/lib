import type { FastifyInstance, FastifyPluginCallback, FastifyServerOptions } from 'fastify'
import type { Logger } from 'pino'
import { fastify } from 'fastify'
import fastifyCookie from 'fastify-cookie'
import fastifyFormbody from 'fastify-formbody'
import fastifyMultipart from 'fastify-multipart'

export interface ServerOptions extends FastifyServerOptions {
  address?: string
  logger?: Logger
  port?: number
}

export class Server {
  public address: string

  public fastify: FastifyInstance

  public fastifyCookie?: FastifyPluginCallback = fastifyCookie

  public fastifyFormbody?: FastifyPluginCallback = fastifyFormbody

  public fastifyMultipart?: FastifyPluginCallback = fastifyMultipart

  public logger?: Logger

  public options: FastifyServerOptions

  public port: number

  public constructor (options: ServerOptions = {}) {
    this.address = options.address ?? '0.0.0.0'
    this.logger = options.logger?.child({ name: 'server' })
    this.options = options
    this.port = options.port ?? 3000
  }

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

  public setup (): void {
    this.fastify = this.createFastify()
  }

  public async start (setup = true): Promise<unknown> {
    this.logger?.info({
      address: this.address,
      port: this.port
    }, 'Starting server')

    if (setup) {
      this.setup()
    }

    return Promise.all([
      this.fastify.register(this.fastifyCookie ?? (() => {})),
      this.fastify.register(this.fastifyFormbody ?? (() => {})),
      this.fastify.register(this.fastifyMultipart ?? (() => {})),
      this.fastify.listen(this.port, this.address)
    ])
  }

  public async stop (): Promise<unknown> {
    this.logger?.info({
      address: this.address,
      port: this.port
    }, 'Stopping server')

    return this.fastify.close()
  }
}
