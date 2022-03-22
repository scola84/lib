import type { IncomingMessage, ServerResponse } from 'http'
import type { RouteData } from '../route'
import { RouteHandler } from '../route'
import type { SqlQueryKeys } from '../sql'

export abstract class CrudHandler extends RouteHandler {
  public abstract keys: SqlQueryKeys

  public abstract object: string

  public async prepareRoute (data: RouteData, response: ServerResponse, request: IncomingMessage): Promise<void> {
    await super.prepareRoute(data, response, request)

    if (
      this.keys.auth !== undefined &&
      data.user === undefined
    ) {
      response.statusCode = 401
      throw new Error('User is undefined')
    }
  }
}
