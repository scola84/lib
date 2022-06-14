import type { Query, Struct } from '../../../../common'
import type { Schema, SchemaField } from '../../../helpers/schema'
import { ScolaError, isStruct, toString } from '../../../../common'
import { CrudInsertHandler } from './insert'
import type { Merge } from 'type-fest'
import type { RouteData } from '../../../helpers/route'

export interface CrudInsertManyData extends RouteData {
  body: Struct[]
  query: Query
}

export abstract class CrudInsertManyHandler extends CrudInsertHandler {
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

  public async handle (data: CrudInsertManyData): Promise<unknown[]> {
    return Promise.all(data.body.map(async (insertData) => {
      try {
        if (isStruct(insertData)) {
          return await this.insert(data.query, insertData, data.user)
        }

        return undefined
      } catch (error: unknown) {
        return new ScolaError({
          code: 'err_insert',
          message: toString(error),
          status: 400
        })
      }
    }))
  }
}
