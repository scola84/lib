import { RouteHandler } from '../route'
import type { SqlQueryKeys } from '../sql'

export abstract class RestHandler extends RouteHandler {
  public abstract keys: SqlQueryKeys

  public abstract object: string
}
