import type { Schema, SchemaField } from '../schema'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'
import type { Query } from '../../../common'
import type { RouteData } from '../route'

interface CrudSelectAllData extends RouteData {
  query: Query
}

export abstract class CrudSelectAllHandler extends CrudHandler {
  public method = 'GET'

  public abstract schema: {
    query: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudSelectAllData): Promise<unknown[]> {
    const authKeys = this.keys.foreign?.filter((key) => {
      return data.query.join?.[key.table] !== undefined
    }) ?? this.keys.related?.filter((key) => {
      return data.query.join?.[key.column] !== undefined
    }) ?? this.keys.primary ?? []

    const selectAllQuery = this.database.formatter.createSelectAllQuery(this.object, this.keys, authKeys, data.query, data.user)
    return this.database.selectAll(selectAllQuery.string, selectAllQuery.values)
  }
}
