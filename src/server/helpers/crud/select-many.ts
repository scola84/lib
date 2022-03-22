import type { Schema, SchemaField } from '../schema'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'
import type { RouteData } from '../route'
import type { Struct } from '../../../common'
import { isNil } from '../../../common'

export interface CrudSelectManyData extends RouteData {
  body?: Struct[]
}

export abstract class CrudSelectManyHandler extends CrudHandler {
  public method = 'POST'

  public abstract schema: {
    body: Merge<SchemaField, {
      schema: Schema
      type: 'array'
    }>
    headers: {
      schema: {
        'if-modified-since': {
          type: 'datetime-local'
        }
      }
      type: 'struct'
    }
  }

  public async handle (data: CrudSelectManyData): Promise<unknown[]> {
    const modified = data.headers['if-modified-since']

    if (modified !== undefined) {
      const selectManyModifiedQuery = this.database.formatter.createSelectManyModifiedQuery(this.object, this.keys, this.keys.primary ?? [], new Date(modified), data.user)
      return this.database.selectAll(selectManyModifiedQuery.string, selectManyModifiedQuery.values)
    }

    const { body } = data

    if (!isNil(body)) {
      const selectManyInQuery = this.database.formatter.createSelectManyInQuery(this.object, this.keys, this.keys.primary ?? [], body, data.user)
      return this.database.selectAll(selectManyInQuery.string, selectManyInQuery.values)
    }

    const selectManyQuery = this.database.formatter.createSelectManyQuery(this.object, this.keys, this.keys.primary ?? [], data.user)
    return this.database.selectAll(selectManyQuery.string, selectManyQuery.values)
  }
}
