import type { Query, Struct } from '../../../common'
import type { Schema, SchemaField } from '../schema'
import { isStruct, toString } from '../../../common'
import { CrudDeleteHandler } from './delete'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'

export interface CrudDeleteManyData extends RouteData {
  body: Struct[]
  query: Query
}

export abstract class CrudDeleteManyHandler extends CrudDeleteHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'array'
    }>
    query: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudDeleteManyData, response: ServerResponse): Promise<unknown[]> {
    return Promise.all(data.body.map(async (deleteData) => {
      try {
        if (isStruct(deleteData)) {
          return await this.delete(data.query, deleteData, response, data.user)
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
