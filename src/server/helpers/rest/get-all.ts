import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { SqlSelectAllParameters } from '../sql'

interface GetAllData extends RouteData {
  query: SqlSelectAllParameters
}

export abstract class RestGetAllHandler extends RestHandler {
  protected async handle (data: GetAllData, response: ServerResponse): Promise<unknown[]> {
    if (
      this.keys.auth !== undefined &&
      data.user === undefined
    ) {
      response.statusCode = 401
      throw new Error(`User is undefined for "GET ${this.url}"`)
    }

    const authKeys = this.keys.foreign?.filter((key) => {
      return data.query[key.column] !== undefined
    }) ?? this.keys.related?.filter((key) => {
      return data.query[key.column] !== undefined
    }) ?? this.keys.primary ?? []

    const selectAllQuery = this.database.formatter.createSelectAllQuery(this.object, this.keys, authKeys, data.query, data.user)
    return this.database.selectAll(selectAllQuery.string, selectAllQuery.values)
  }
}
