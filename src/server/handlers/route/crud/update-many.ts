import type { Query, Struct } from '../../../../common'
import type { Schema, SchemaField } from '../../../helpers/schema'
import { isStruct, toString } from '../../../../common'
import { CrudUpdateHandler } from './update'
import type { Merge } from 'type-fest'
import type { RouteData } from '../../../helpers/route'
import type { ServerResponse } from 'http'

export interface CrudUpdateManyData extends RouteData {
  body: Struct[]
  query: Query
}

export abstract class CrudUpdateManyHandler extends CrudUpdateHandler {
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

  public async handle (data: CrudUpdateManyData, response: ServerResponse): Promise<unknown[]> {
    return Promise.all(data.body.map(async (updateData) => {
      try {
        if (isStruct(updateData)) {
          return await this.update(data.query, updateData, response, data.user)
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
