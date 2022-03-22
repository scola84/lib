import type { Schema, SchemaField } from '../schema'
import { CrudInsertHandler } from './insert'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'
import { isStruct } from '../../../common'

export interface CrudInsertManyData extends RouteData {
  body: Struct[]
}

export abstract class CrudInsertManyHandler extends CrudInsertHandler {
  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'array'
    }>
  }

  public async handle (data: CrudInsertManyData, response: ServerResponse): Promise<unknown[]> {
    return Promise.all(data.body.map(async (insertData) => {
      try {
        if (isStruct(insertData)) {
          return await this.insert(insertData, response, this.schema.body.schema, data.user)
        }

        return undefined
      } catch (error: unknown) {
        response.statusCode = 400
        return {
          message: String(error)
        }
      }
    }))
  }
}
