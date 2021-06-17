import type { Logger } from 'pino'
import type { Queuer } from '../queue'
import type { Server } from '../fastify'
import { isMatch } from 'micromatch'

export type Services = Record<string, {
  /**
   * The queues to manage.
   */
  queues?: Record<string, () => void>

  /**
   * The routes to manage.
   */
  routes?: Record<string, () => void>
}>

export interface ServiceManagerOptions {
  /**
   * The logger.
   */
  logger?: Logger

  /**
   * The names of the `services` to manage.
   *
   * Must be one or more micromatch patterns, separated by a colon.
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
   * The services to manage.
   */
  services: Services

  /**
   * The signal to stop the delegates.
   *
   * @defaultValue 'SIGTERM'.
   */
  signal?: NodeJS.Signals | null

  /**
   * The types of the delegates to manage.
   *
   * Must be one or more micromatch patterns, separated by a colon.
   *
   * @defaultValue `process.env.SERVICE_TYPES` or '*'
   * @see https://www.npmjs.com/package/micromatch
   */
  types?: string[] | string
}

/**
 * Manages the services of the application.
 */
export class ServiceManager {
  /**
   * The logger.
   */
  public logger?: Logger

  /**
   * The names of the `services` to manage.
   *
   * Must be one or more micromatch patterns, separated by a colon.
   *
   * @defaultValue `process.env.SERVICE_NAMES` or '*'
   * @see https://www.npmjs.com/package/micromatch
   */
  public names: string[] | string

  /**
   * The NodeJS process to listen for the stop signal.
   */
  public process = process

  /**
   * The queuer.
   */
  public queuer?: Queuer

  /**
   * The server.
   */
  public server?: Server

  /**
   * The services to manage.
   */
  public services: Services

  /**
   * The signal to stop the delegates.
   *
   * @defaultValue 'SIGTERM'.
   */
  public signal: NodeJS.Signals | null

  /**
   * The types of the delegates to manage.
   *
   * Must be one or more micromatch patterns, separated by a colon.
   *
   * @defaultValue `process.env.SERVICE_TYPES` or '*'
   * @see https://www.npmjs.com/package/micromatch
   */
  public types: string[] | string

  /**
   * Constructs a service manager.
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
   * Starts the `queuer` and/or `server`, which are delegates of the `ServiceManager` to manage queues and routes respectively.
   *
   * To determine whether a delegate should be started, the delegate type is matched against the micromatch patterns provided by `types`.
   *
   * Starts the `services` by calling their factory methods.
   *
   * To determine whether a service should be started, the service name is matched against the micromatch patterns provided by `names`.
   *
   * A service name is constructed by concatenating its nested keys, i.e. \{service\}.\{type\}.\{factory\} -  the available types are 'queues' and 'routes'.
   *
   * The factory methods should simply instantiate and start the `TaskRunner`s and/or `RouteHandler`s of the application.
   *
   * Listen for the stop `signal` and calls `stop` if the signal is received.
   *
   * Exits the NodeJS process if an error occurs during startup.
   */
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
            factory()
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

  /**
   * Stops the delegates. The delegates are responsible for stopping the services they manage.
   *
   * Exits the NodeJS process after the delegates have been stopped.
   */
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
