import type { Schema, SchemaField } from '../schema'
import { CrudDeleteHandler } from './delete'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

interface CrudDeleteOneData extends RouteData {
  body: Struct
}

export abstract class CrudDeleteOneHandler extends CrudDeleteHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudDeleteOneData, response: ServerResponse): Promise<unknown> {
    return this.delete(data.body, response, this.schema.body.schema, data.user)
  }
}
