export function del (object: string): string {
  return `
import type { RouteData, RouteHandlerOptions } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface DeleteData extends RouteData {
  query: {
    ${object}_id: number
  }
}

export interface DeleteHandlerOptions extends Partial<RouteHandlerOptions> {}

export class DeleteHandler extends RouteHandler {
  public responseType = 'application/json'

  public schema = {
    query: {
      ${object}_id: {
        required: true,
        type: 'number'
      }
    }
  }

  public constructor (options: DeleteHandlerOptions) {
    super(options)
  }

  protected async handle (data: DeleteData): Promise<void> {
    return this.database.select(sql\`
      DELETE
      FROM $[${object}]
      WHERE $[${object}_id] = $(${object}_id)
    \`, {
      ${object}_id: data.query.${object}_id
    })
  }
}
`.trim()
}
