export function get (object: string): string {
  return `
import type { RouteData, RouteHandlerOptions } from '@scola/lib'
import { RouteHandler, sql } from '@scola/lib'

interface GetData extends RouteData {
  query: {
    ${object}_id: number
  }
}

export interface GetHandlerOptions extends Partial<RouteHandlerOptions> {}

export class GetHandler extends RouteHandler {
  public responseType = 'application/json'

  public schema = {
    query: {
      ${object}_id: {
        required: true,
        type: 'number'
      }
    }
  }

  public constructor (options: GetHandlerOptions) {
    super(options)
  }

  protected async handle (data: GetData): Promise<void> {
    return this.database.select(sql\`
      SELECT *
      FROM $[${object}]
      WHERE $[${object}_id] = $(${object}_id)
    \`, {
      ${object}_id: data.query.${object}_id
    })
  }
}
`.trim()
}
