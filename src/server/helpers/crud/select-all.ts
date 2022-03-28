import { CrudHandler } from './crud'
import type { Query } from '../../../common'
import type { RouteData } from '../route'
import type { SchemaField } from '../schema'

interface CrudSelectAllData extends RouteData {
  query: Query
}

export abstract class CrudSelectAllHandler extends CrudHandler {
  public method = 'GET'

  public abstract schema: {
    query: SchemaField
  }

  public async handle (data: CrudSelectAllData): Promise<unknown[]> {
    const authKeys = this.keys.foreign?.filter((key) => {
      return data.query[key.column] !== undefined
    }) ?? this.keys.related?.filter((key) => {
      return data.query[key.column] !== undefined
    }) ?? this.keys.primary ?? []

    const selectAllQuery = this.database.formatter.createSelectAllQuery(this.object, this.keys, authKeys, data.query, data.user)
    return this.database.selectAll(selectAllQuery.string, selectAllQuery.values)
  }
}
