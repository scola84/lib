import type { SqlDatabase, SqlQueryKeys } from '../../../helpers/sql'
import { RouteHandler } from '../../../helpers/route'
import type { RouteHandlerOptions } from '../../../helpers/route'

export abstract class CrudHandler extends RouteHandler {
  public database: SqlDatabase

  public abstract keys: SqlQueryKeys

  public abstract object: string

  public constructor (options?: Partial<RouteHandlerOptions>) {
    const handlerOptions = {
      ...RouteHandler.options,
      ...options
    }

    if (handlerOptions.database === undefined) {
      throw new Error('Option "database" is undefined')
    }

    super(handlerOptions)
  }
}
