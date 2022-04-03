import type { FastifyServer } from '../fastify'
import type { Logger } from 'pino'
import type { Queuer } from '../queue'
import type { RedisClientType } from 'redis'
import type { Router } from '../route'
import type { SqlDatabase } from '../sql'
import type { Struct } from '../../../common'
import { isMatch } from 'micromatch'
import { toString } from '../../../common'

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
   * @see {@link SqlDatabase}
   */
  databases?: Struct<SqlDatabase>

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
   * The router.
   *
   * @see {@link Router}
   */
  router?: Router

  /**
   * The server.
   *
   * @see {@link Server}
   */
  server?: FastifyServer

  /**
   * The services.
   *
   * The factory methods must instantiate and start the queue and/or route handlers of the application.
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
   * The store.
   *
   * @see https://preview.npmjs.com/package/redis
   */
  store: RedisClientType

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
   * @see {@link SqlDatabase}
   */
  public databases?: Struct<SqlDatabase>

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
   * @see {@link Router}
   */
  public router?: Router

  /**
   * The delegate to manage routes.
   *
   * @see {@link Server}
   */
  public server?: FastifyServer

  /**
   * The services.
   *
   * The factory methods must instantiate and start the queue and/or route handlers of the application.
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
   * The store.
   *
   * @see https://preview.npmjs.com/package/redis
   */
  public store: RedisClientType

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
    this.logger = options.logger
    this.names = options.names ?? process.env.SERVICE_NAMES?.split(':') ?? '*'
    this.queuer = options.queuer
    this.router = options.router
    this.server = options.server
    this.services = options.services
    this.store = options.store
    this.signal = options.signal ?? 'SIGTERM'
    this.types = options.types ?? process.env.SERVICE_TYPES?.split(':') ?? '*'
  }

  /**
   * Starts the service manager.
   *
   * Starts `databases` and `store`. Starts `queuer`, `router` and `server` depending on `types`. Starts `services` depending on `names`.
   *
   * Listens for the stop `signal` and calls `stop` if the signal is received.
   *
   * Exits `process` if an error occurs during startup.
   */
  public start (): void {
    Promise
      .resolve()
      .then(async () => {
        this.logger = this.logger?.child({
          name: 'service-manager'
        })

        this.logger?.info({
          names: this.names,
          signal: this.signal,
          types: this.types
        }, 'Starting service manager')

        await Promise.all([
          this.startDatabases(),
          this.startStore()
        ])

        if (isMatch('queuer', this.types)) {
          await this.queuer?.start()
        }

        if (isMatch('server', this.types)) {
          await this.router?.start(false)
          await this.startServer()
        }

        this.startServices()

        if (isMatch('server', this.types)) {
          await this.server?.listen()
        }

        if (this.signal !== null) {
          this.process.once(this.signal, this.stop.bind(this))
        }
      })
      .catch((error) => {
        this.logger?.error({
          context: 'start'
        }, toString(error))

        this.process.exit()
      })
  }

  /**
   * Stops the service manager.
   *
   * Stops `queuer`, `router` and `server`, which are responsible for stopping the services they manage. Stops `databases` and `store`.
   *
   * Exits `process` after the delegates have been stopped.
   */
  public stop (): void {
    Promise
      .resolve()
      .then(async () => {
        this.logger?.info('Stopping service manager')

        if (isMatch('queuer', this.types)) {
          await this.queuer?.stop()
        }

        if (isMatch('server', this.types)) {
          await this.router?.stop()

          if (this.router?.server?.listening === true) {
            await this.server?.stop()
          }
        }

        await Promise.all([
          this.stopDatabases(),
          this.stopStore()
        ])

        this.logger?.info('Stopped service manager')
      })
      .catch((error) => {
        this.logger?.error({
          context: 'stop'
        }, toString(error))
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
      await database.start()
    }))
  }

  /**
   * Starts `server`.
   */
  protected async startServer (): Promise<void> {
    if (
      this.router?.server !== undefined &&
      this.server !== undefined
    ) {
      this.server.server = this.router.server
      await this.server.start()
      this.router.fastify = this.server.handle
    }
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
   * Starts `store`.
   */
  protected async startStore (): Promise<void> {
    this.store.on('error', (error) => {
      this.logger?.error({
        context: 'store'
      }, toString(error))
    })

    await this.store.connect()
  }

  /**
   * Stops `databases`.
   */
  protected async stopDatabases (): Promise<void> {
    const databases = Object.values(this.databases ?? {})

    await Promise.all(databases.map(async (database) => {
      await database.stop()
    }))
  }

  /**
   * Stops `store`.
   */
  protected async stopStore (): Promise<void> {
    this.store.removeAllListeners()
    await this.store.quit()
  }
}
