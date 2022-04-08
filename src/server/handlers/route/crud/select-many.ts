import type { Query, Struct } from '../../../../common'
import type { Schema, SchemaField } from '../../../helpers/schema'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'
import type { RouteData } from '../../../helpers/route'
import { isNil } from '../../../../common'

export interface CrudSelectManyData extends RouteData {
  body?: Struct[]
  headers: Partial<Struct<string>>
  query: Query
}

export abstract class CrudSelectManyHandler extends CrudHandler {
  public method = 'POST'

  public abstract schema: {
    body: Merge<SchemaField, {
      schema: Schema
      type: 'array'
    }>
    query: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudSelectManyData): Promise<unknown[]> {
    if (
      this.keys.modified !== undefined &&
      data.query.where?.[this.keys.modified.column] !== undefined
    ) {
      const selectManyModifiedQuery = this.database.formatter.createSelectManyModifiedQuery(this.object, this.schema.query.schema, this.keys, this.keys.primary ?? [], data.query, data.user)
      return this.database.selectAll(selectManyModifiedQuery.string, selectManyModifiedQuery.values)
    }

    const { body } = data

    if (!isNil(body)) {
      const selectManyInQuery = this.database.formatter.createSelectManyInQuery(this.object, this.schema.query.schema, this.keys, this.keys.primary ?? [], body, data.query, data.user)
      return this.database.selectAll(selectManyInQuery.string, selectManyInQuery.values)
    }

    const selectManyQuery = this.database.formatter.createSelectManyQuery(this.object, this.schema.query.schema, this.keys, this.keys.primary ?? [], data.query, data.user)
    return this.database.selectAll(selectManyQuery.string, selectManyQuery.values)
  }
}
