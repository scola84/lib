import type { Schema, SchemaField } from '../schema'
import { isStruct, toString } from '../../../common'
import { CrudUpdateHandler } from './update'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

export interface CrudUpdateManyData extends RouteData {
  body: Struct[]
}

export abstract class CrudUpdateManyHandler extends CrudUpdateHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'array'
    }>
  }

  public async handle (data: CrudUpdateManyData, response: ServerResponse): Promise<unknown[]> {
    return Promise.all(data.body.map(async (updateData) => {
      try {
        if (isStruct(updateData)) {
          return await this.update(updateData, response, this.schema.body.schema, data.user)
        }

        return undefined
      } catch (error: unknown) {
        response.statusCode = 400
        return {
          message: toString(error)
        }
      }
    }))
  }
}
