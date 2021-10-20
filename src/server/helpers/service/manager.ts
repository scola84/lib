import type { Database } from '../sql'
import type { Logger } from 'pino'
import type { Queuer } from '../queue'
import type { Server } from '../fastify'
import type { Struct } from '../../../common'
import { isMatch } from 'micromatch'

export interface Services {
  [key: string]: {
    queues?: Struct<() => void>
    routes?: Struct<() => void>
  }
}

export interface ServiceManagerOptions {
  /**
   * The databases to manage.
   *
   * @see {@link Database}
   */
  databases?: Struct<Database>

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
   *
   * @see {@link Queuer}
   */
  queuer?: Queuer

  /**
   * The server.
   *
   * @see {@link Server}
   */
  server?: Server

  /**
   * The services.
   *
   * The factory methods must instantiate and start the TaskRunners and/or RouteHandlers of the application.
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
   * The databases to manage.
   *
   * @see {@link Database}
   */
  public databases?: Struct<Database>

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
   *
   * @see {@link Queuer}
   */
  public queuer?: Queuer

  /**
   * The delegate to manage routes.
   *
   * @see {@link Server}
   */
  public server?: Server

  /**
   * The services.
   *
   * The factory methods must instantiate and start the TaskRunners and/or RouteHandlers of the application.
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
    this.databases = options.databases
    this.names = options.names ?? process.env.SERVICE_NAMES?.split(':') ?? '*'
    this.queuer = options.queuer
    this.server = options.server
    this.services = options.services
    this.signal = options.signal ?? 'SIGTERM'
    this.types = options.types ?? process.env.SERVICE_TYPES?.split(':') ?? '*'

    this.logger = options.logger?.child({
      name: 'service-manager'
    })
  }

  /**
   * Starts the service manager.
   *
   * Starts `services` depending on `names`. Starts `databases`. Starts
   * `queuer` and `server` depending on `types`.
   *
   * Listens for the stop `signal` and calls `stop` if the signal is received.
   *
   * Exits `process` if an error occurs during startup.
   */
  public start (): void {
    Promise
      .resolve()
      .then(async () => {
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

        this.startServices()
        await this.startDatabases()

        if (isMatch('server', this.types)) {
          await this.server?.start(false)
        }

        if (isMatch('queuer', this.types)) {
          await this.queuer?.start(false)
        }

        if (this.signal !== null) {
          this.process.once(this.signal, this.stop.bind(this))
        }
      })
      .catch((error) => {
        this.logger?.error({
          context: 'start'
        }, String(error))

        this.process.exit()
      })
  }

  /**
   * Stops the service manager.
   *
   * Stops `queuer`, `server`, which are responsible for stopping the services
   * they manage. Stops `databases`.
   *
   * Exits `process` after the delegates have been stopped.
   */
  public stop (): void {
    Promise
      .resolve()
      .then(async () => {
        this.logger?.info('Stopping service manager')

        if (isMatch('server', this.types)) {
          await this.server?.stop()
        }

        if (isMatch('queuer', this.types)) {
          await this.queuer?.stop()
        }

        await this.stopDatabases()
      })
      .catch((error) => {
        this.logger?.error({
          context: 'stop'
        }, String(error))
      })
      .finally(() => {
        this.process.exit()
      })
  }

  /**
   * Starts `databases`.
   */
  protected async startDatabases (): Promise<void> {
    const databases = Object.values(this.databases ?? {})

    await Promise.all(databases.map(async (database) => {
      return database.start()
    }))
  }

  /**
   * Starts `services` depending on `names`.
   */
  protected startServices (): void {
    Object.entries(this.services).forEach(([sn, service]) => {
      Object.entries(service).forEach(([tn, type]) => {
        Object.entries(type).forEach(([fn, start]) => {
          if (isMatch(`${sn}.${tn}.${fn}`, this.names)) {
            start()
          }
        })
      })
    })
  }

  /**
   * Stops `databases`.
   */
  protected async stopDatabases (): Promise<void> {
    const databases = Object.values(this.databases ?? {})

    await Promise.all(databases.map(async (database) => {
      return database.stop()
    }))
  }
}
