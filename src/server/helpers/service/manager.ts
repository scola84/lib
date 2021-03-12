import type { Logger } from 'pino'
import type { Queuer } from '../queue'
import type { Server } from '../fastify'
import { isMatch } from 'micromatch'

export type Services = Record<string, {
  queues?: Record<string, () => void>
  routes?: Record<string, () => void>
}>

export interface ServiceManagerOptions {
  names?: string[] | string
  logger: Logger
  queuer?: Queuer
  server?: Server
  services: Services
  signal: string | null
  types?: string[] | string
}

export class ServiceManager {
  public lib = {
    process
  }

  public logger: Logger

  public names: string[] | string

  public queuer?: Queuer

  public server?: Server

  public services: Services

  public signal: string | null

  public types: string[] | string

  public constructor (options: Partial<ServiceManagerOptions> = {}) {
    const {
      names = process.env.SERVICE_NAMES?.split(':') ?? '*',
      logger,
      queuer,
      server,
      services,
      signal = 'SIGTERM',
      types = process.env.SERVICE_TYPES?.split(':') ?? '*'
    } = options

    if (logger === undefined) {
      throw new Error('Logger is undefined')
    }

    if (services === undefined) {
      throw new Error('Services are undefined')
    }

    this.names = names
    this.logger = logger.child({ name: 'service-manager' })
    this.queuer = queuer
    this.server = server
    this.services = services
    this.signal = signal
    this.types = types
  }

  public start (): void {
    this.logger.info({
      names: this.names,
      signal: this.signal,
      types: this.types
    }, 'Starting')

    if (isMatch('server', this.types)) {
      this.server?.setup()
    }

    if (isMatch('queuer', this.types)) {
      this.queuer?.setup()
    }

    Object.entries(this.services).forEach(([sn, service]) => {
      Object.entries(service).forEach(([tn, type]) => {
        Object.entries(type ?? {}).forEach(([fn, factory]) => {
          if (isMatch(`${sn}.${tn}.${fn}`, this.names)) {
            (factory as () => void)()
          }
        })
      })
    })

    Promise
      .all([
        isMatch('server', this.types) ? this.server?.start() : null,
        isMatch('queuer', this.types) ? this.queuer?.start() : null
      ])
      .catch((error) => {
        this.logger.error(String(error))
        this.lib.process.exit()
      })

    if (this.signal !== null) {
      this.lib.process.on(this.signal, () => {
        this.stop()
      })
    }
  }

  public stop (): void {
    Promise
      .all([
        isMatch('server', this.types) ? this.server?.stop() : null,
        isMatch('queuer', this.types) ? this.queuer?.stop() : null
      ])
      .then(() => {
        this.lib.process.exit()
      })
      .catch((error) => {
        this.logger.error(String(error))
        this.lib.process.exit()
      })
  }
}
