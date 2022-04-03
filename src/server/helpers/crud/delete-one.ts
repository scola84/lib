import type { Query, Struct } from '../../../common'
import type { Schema, SchemaField } from '../schema'
import { CrudDeleteHandler } from './delete'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'

interface CrudDeleteOneData extends RouteData {
  body: Struct
  query: Query
}

export abstract class CrudDeleteOneHandler extends CrudDeleteHandler {
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

  public async handle (data: CrudDeleteOneData, response: ServerResponse): Promise<unknown> {
    return this.delete(data.query, data.body, response, data.user)
  }
}
