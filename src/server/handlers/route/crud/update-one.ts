import type { Query, Struct } from '../../../../common'
import type { Schema, SchemaField } from '../../../helpers/schema'
import { CrudUpdateHandler } from './update'
import type { Merge } from 'type-fest'
import type { RouteData } from '../../../helpers/route'
import type { ServerResponse } from 'http'

interface CrudUpdateOneData extends RouteData {
  body: Struct
  query: Query
}

export abstract class CrudUpdateOneHandler extends CrudUpdateHandler {
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

  public async handle (data: CrudUpdateOneData, response: ServerResponse): Promise<unknown> {
    return this.update(data.query, data.body, response, data.user)
  }
}