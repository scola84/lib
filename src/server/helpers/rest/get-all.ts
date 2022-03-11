import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { SqlSelectAllParameters } from '../sql'
import type { Struct } from '../../../common'

interface GetAllData extends RouteData {
  query: SqlSelectAllParameters
}

export abstract class RestGetAllHandler extends RestHandler {
  protected async handle (data: GetAllData): Promise<unknown[]> {
    const authKeys = this.keys.foreign?.filter((key) => {
      return data.query[key.column] !== undefined
    }) ?? this.keys.related?.filter((key) => {
      return data.query[key.column] !== undefined
    }) ?? this.keys.primary ?? []

    const query = this.database.formatter.createSelectAllQuery(this.object, this.keys, authKeys, data.query, data.user)
    return this.database.execute<Struct, unknown[]>(query)
  }
}
