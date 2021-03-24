import type { FastifyInstance, FastifyPluginCallback, FastifyServerOptions } from 'fastify'
import type { Logger } from 'pino'
import { ServerError } from './error'
import { fastify } from 'fastify'
import fastifyCookie from 'fastify-cookie'
import fastifyFormbody from 'fastify-formbody'
import fastifyMultipart from 'fastify-multipart'

export interface ServerOptions extends FastifyServerOptions {
  address: string
  logger: Logger
  port: number
}

export class Server {
  public address: string

  public fastify: FastifyInstance

  public logger: Logger

  public options: FastifyServerOptions

  public port: number

  public constructor (options: Partial<ServerOptions> = {}) {
    if (options.logger === undefined) {
      throw new Error('Option "logger" is undefined')
    }

    this.address = options.address ?? '0.0.0.0'
    this.logger = options.logger.child({ name: 'server' })
    this.options = options
    this.port = options.port ?? 3000
  }

  public createFastify (): FastifyInstance {
    return fastify({
      ajv: {
        customOptions: {
          allErrors: true,
          verbose: true
        }
      },
      ...this.options
    })
  }

  public createFastifyCookie (): FastifyPluginCallback {
    return fastifyCookie
  }

  public createFastifyFormbody (): FastifyPluginCallback {
    return fastifyFormbody
  }

  public createFastifyMultipart (): FastifyPluginCallback {
    return fastifyMultipart
  }

  public setup (): void {
    this.fastify = this.createFastify()

    this.fastify.addHook('preSerialization', (request, reply, data, done) => {
      done(null, reply.statusCode >= 400 ? data : {
        code: 'OK',
        data
      })
    })

    this.fastify.setErrorHandler(({ code, validation }, request, reply) => {
      reply
        .send(new ServerError(code, validation))
        .then(() => {}, (error: unknown) => {
          this.logger.error(String(error))
        })
    })

    this.fastify.setNotFoundHandler((request, reply) => {
      reply
        .code(404)
        .send(new ServerError('ERR_NOT_FOUND'))
        .then(() => {}, (error: unknown) => {
          this.logger.error(String(error))
        })
    })
  }

  public async start (): Promise<unknown> {
    this.logger.info({
      address: this.address,
      port: this.port
    }, 'Starting')

    return Promise.all([
      this.fastify.register(this.createFastifyCookie()),
      this.fastify.register(this.createFastifyFormbody()),
      this.fastify.register(this.createFastifyMultipart()),
      this.fastify.listen(this.port, this.address)
    ])
  }

  public async stop (): Promise<unknown> {
    this.logger.info('Stopping')
    return this.fastify.close()
  }
}
