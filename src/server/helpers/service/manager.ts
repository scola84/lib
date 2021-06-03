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
  logger?: Logger
  queuer?: Queuer
  server?: Server
  services: Services
  signal?: NodeJS.Signals | null
  types?: string[] | string
}

export class ServiceManager {
  public logger?: Logger

  public names: string[] | string

  public process = process

  public queuer?: Queuer

  public server?: Server

  public services: Services

  public signal: NodeJS.Signals | null

  public types: string[] | string

  public constructor (options: ServiceManagerOptions) {
    this.names = options.names ?? process.env.SERVICE_NAMES?.split(':') ?? '*'
    this.logger = options.logger?.child({ name: 'service-manager' })
    this.queuer = options.queuer
    this.server = options.server
    this.services = options.services
    this.signal = options.signal ?? 'SIGTERM'
    this.types = options.types ?? process.env.SERVICE_TYPES?.split(':') ?? '*'
  }

  public start (): void {
    this.logger?.info({
      names: this.names,
      signal: this.signal,
      types: this.types
    }, 'Starting service manager')

    if (isMatch('server', this.types)) {
      this.server?.setup()
    }

    if (isMatch('queuer', this.types)) {
      this.queuer?.setup()
    }

    Object.entries(this.services).forEach(([sn, service]) => {
      Object.entries(service).forEach(([tn, type]) => {
        Object.entries(type).forEach(([fn, factory]) => {
          if (isMatch(`${sn}.${tn}.${fn}`, this.names)) {
            (factory as () => void)()
          }
        })
      })
    })

    Promise
      .all([
        isMatch('server', this.types) ? this.server?.start(false) : null,
        isMatch('queuer', this.types) ? this.queuer?.start(false) : null
      ])
      .catch((error) => {
        this.logger?.error(String(error))
        this.process.exit()
      })

    if (this.signal !== null) {
      this.process.once(this.signal, () => {
        this.stop()
      })
    }
  }

  public stop (): void {
    this.logger?.info({
      names: this.names,
      signal: this.signal,
      types: this.types
    }, 'Stopping service manager')

    Promise
      .all([
        isMatch('server', this.types) ? this.server?.stop() : null,
        isMatch('queuer', this.types) ? this.queuer?.stop() : null
      ])
      .catch((error) => {
        this.logger?.error(String(error))
      })
      .finally(() => {
        this.process.exit()
      })
  }
}
