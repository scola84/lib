import type { Schema, SchemaField } from '../schema'
import { CrudUpdateHandler } from './update'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

export interface CrudUpdateOneData extends RouteData {
  body: Struct
}

export abstract class CrudUpdateOneHandler extends CrudUpdateHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudUpdateOneData, response: ServerResponse): Promise<unknown> {
    return this.update(data.body, response, this.schema.body.schema, data.user)
  }
}
