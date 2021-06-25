import type { Logger } from 'pino'
import type { Queuer } from '../queue'
import type { Server } from '../fastify'
import { isMatch } from 'micromatch'

export type Services = Record<string, {
  queues?: Record<string, () => void>
  routes?: Record<string, () => void>
}>

export interface ServiceManagerOptions {
  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  logger?: Logger

  /**
   * The names of `services` to manage as one or more micromatch patterns, separated by a colon.
   *
   * To determine whether a service should be started, the service name is matched against the micromatch patterns provided by `names`.
   *
   * A service name is created by concatenating its nested keys, i.e. \{service\}.\{type\}.\{factory\} -  the available types are 'queues' and 'routes'.
   *
   * @defaultValue `process.env.SERVICE_NAMES` or '*'
   * @see https://www.npmjs.com/package/micromatch
   */
  names?: string[] | string

  /**
   * The queuer.
   */
  queuer?: Queuer

  /**
   * The server.
   */
  server?: Server

  /**
   * The services.
   *
   * The factory methods must instantiate and start the `TaskRunner`s and/or `RouteHandler`s of the application.
   */
  services: Services

  /**
   * The signal to stop the delegates.
   *
   * @defaultValue 'SIGTERM'.
   * @see https://nodejs.org/api/process.html#process_signal_events
   */
  signal?: NodeJS.Signals | null

  /**
   * The types of the delegates to manage as one or more micromatch patterns, separated by a colon.
   *
   * To determine whether a delegate should be started, the delegate type is matched against the micromatch patterns.
   *
   * The delegate types are 'queuer' and 'server'.
   *
   * @defaultValue `process.env.SERVICE_TYPES` or '*'
   * @see https://www.npmjs.com/package/micromatch
   */
  types?: string[] | string
}

/**
 * Manages services.
 */
export class ServiceManager {
  /**
   * The logger.
   *
   * @see https://www.npmjs.com/package/pino
   */
  public logger?: Logger

  /**
   * The names of `services` to manage as one or more micromatch patterns, separated by a colon.
   *
   * To determine whether a service should be started, the service name is matched against the micromatch patterns.
   *
   * A service name is created by concatenating its nested keys, i.e. \{service\}.\{type\}.\{factory\} -  the available types are 'queues' and 'routes'.
   *
   * @defaultValue `process.env.SERVICE_NAMES` or '*'
   * @see https://www.npmjs.com/package/micromatch
   */
  public names: string[] | string

  /**
   * The NodeJS process.
   *
   * @see https://nodejs.org/api/process.html
   */
  public process = process

  /**
   * The delegate to manage queues.
   */
  public queuer?: Queuer

  /**
   * The delegate to manage routes.
   */
  public server?: Server

  /**
   * The services.
   *
   * The factory methods must instantiate and start the `TaskRunner`s and/or `RouteHandler`s of the application.
   */
  public services: Services

  /**
   * The signal to stop the delegates.
   *
   * @defaultValue 'SIGTERM'.
   * @see https://nodejs.org/api/process.html#process_signal_events
   */
  public signal: NodeJS.Signals | null

  /**
   * The types of the delegates to manage as one or more micromatch patterns, separated by a colon.
   *
   * To determine whether a delegate should be started, the delegate type is matched against the micromatch patterns.
   *
   * The delegate types are 'queuer' and 'server'.
   *
   * @defaultValue `process.env.SERVICE_TYPES` or '*'
   * @see https://www.npmjs.com/package/micromatch
   */
  public types: string[] | string

  /**
   * Creates a service manager.
   *
   * @param options - The server manager options
   */
  public constructor (options: ServiceManagerOptions) {
    this.names = options.names ?? process.env.SERVICE_NAMES?.split(':') ?? '*'
    this.logger = options.logger?.child({ name: 'service-manager' })
    this.queuer = options.queuer
    this.server = options.server
    this.services = options.services
    this.signal = options.signal ?? 'SIGTERM'
    this.types = options.types ?? process.env.SERVICE_TYPES?.split(':') ?? '*'
  }

  /**
   * Starts the service manager.
   *
   * Starts `queuer` and `server` depending on `types` and starts `services` depending on `names`.
   *
   * Listens for the stop `signal` and calls `stop` if the signal is received.
   *
   * Exits `process` if an error occurs during startup.
   */
  public async start (): Promise<void> {
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
            factory()
          }
        })
      })
    })

    await Promise
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
        this.stop().catch(() => {})
      })
    }
  }

  /**
   * Stops the service manager.
   *
   * Stops `queuer` and `server`, which are responsible for stopping the services they manage.
   *
   * Exits `process` after the delegates have been stopped.
   */
  public async stop (): Promise<void> {
    this.logger?.info({
      names: this.names,
      signal: this.signal,
      types: this.types
    }, 'Stopping service manager')

    await Promise
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
