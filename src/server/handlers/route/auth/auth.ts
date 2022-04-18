import type { RouteAuth, RouteHandlerOptions } from '../../../helpers/route'
import type { RedisClientType } from 'redis'
import { RouteHandler } from '../../../helpers/route'
import type { SqlDatabase } from '../../../helpers/sql'

export abstract class AuthHandler extends RouteHandler {
  public auth: RouteAuth

  public authenticate = false

  public authorize = false

  public database: SqlDatabase

  public store: RedisClientType

  public constructor (options?: Partial<RouteHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.auth === undefined) {
      throw new Error('Option "auth" is undefined')
    }

    if (handlerOptions.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    if (handlerOptions.store === undefined) {
      throw new Error('Option "store" is undefined')
    }

    super(handlerOptions)
  }
}
