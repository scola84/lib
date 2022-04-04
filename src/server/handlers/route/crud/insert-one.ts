import type { Query, Struct } from '../../../../common'
import type { Schema, SchemaField } from '../../../helpers/schema'
import { CrudInsertHandler } from './insert'
import type { Merge } from 'type-fest'
import type { RouteData } from '../../../helpers/route'
import type { ServerResponse } from 'http'

interface CrudInsertOneData extends RouteData {
  body: Struct
  query: Query
}

export abstract class CrudInsertOneHandler extends CrudInsertHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
    query: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudInsertOneData, response: ServerResponse): Promise<unknown> {
    return this.insert(data.query, data.body, response, data.user)
  }
}
