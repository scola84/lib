import type { Schema, SchemaField } from '../schema'
import { isStruct, toString } from '../../../common'
import { CrudDeleteHandler } from './delete'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

export interface CrudDeleteManyData extends RouteData {
  body: Struct[]
}

export abstract class CrudDeleteManyHandler extends CrudDeleteHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'array'
    }>
  }

  public async handle (data: CrudDeleteManyData, response: ServerResponse): Promise<unknown[]> {
    return Promise.all(data.body.map(async (deleteData) => {
      try {
        if (isStruct(deleteData)) {
          return await this.delete(deleteData, response, this.schema.body.schema, data.user)
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
