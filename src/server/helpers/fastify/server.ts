import type { FastifyInstance, FastifyServerOptions } from 'fastify'
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

  public lib = {
    fastify,
    fastifyCookie,
    fastifyFormbody,
    fastifyMultipart
  }

  public logger: Logger

  public options: FastifyServerOptions

  public port: number

  public constructor (options: Partial<ServerOptions> = {}) {
    const {
      address = '0.0.0.0',
      logger,
      port = 3000
    } = options

    if (logger === undefined) {
      throw new Error('Logger is undefined')
    }

    this.address = address
    this.logger = logger.child({ name: 'server' })
    this.options = options
    this.port = port
  }

  public setup (): void {
    this.fastify = this.lib.fastify({
      ajv: {
        customOptions: {
          allErrors: true,
          verbose: true
        }
      },
      ...this.options
    })

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
      this.fastify.register(this.lib.fastifyCookie),
      this.fastify.register(this.lib.fastifyFormbody),
      this.fastify.register(this.lib.fastifyMultipart),
      this.fastify.listen(this.port, this.address)
    ])
  }

  public async stop (): Promise<unknown> {
    this.logger.info('Stopping')
    return this.fastify.close()
  }
}
