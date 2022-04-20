import { RouteHandler } from '../../../helpers'
import type { Struct } from '../../../../common'

export class OptionsGetHandler extends RouteHandler {
  public handle (): Struct[] {
    return Array
      .from(this.router.handlers.values())
      .map((handlers) => {
        return Array
          .from(handlers.values())
          .map((handler) => {
            return {
              description: handler.description,
              method: handler.method,
              schema: handler.schema,
              url: handler.url
            }
          })
      })
      .flat()
  }
}
