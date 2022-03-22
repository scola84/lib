import type { Schema, SchemaField } from '../schema'
import { CrudInsertHandler } from './insert'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

interface CrudInsertOneData extends RouteData {
  body: Struct
}

export abstract class CrudInsertOneHandler extends CrudInsertHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudInsertOneData, response: ServerResponse): Promise<unknown> {
    return this.insert(data.body, response, this.schema.body.schema, data.user)
  }
}
