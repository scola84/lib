import type { Query, Struct, User } from '../../../../common'
import type { Schema, SchemaField, SchemaFieldKey } from '../../../helpers/schema'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'
import { ScolaFile } from '../../../../common'
import type { ServerResponse } from 'http'

export abstract class CrudInsertHandler extends CrudHandler {
  public method = 'POST'

  public abstract schema: {
    body: Merge<SchemaField, {
      required: true
      schema: Schema
    }>
    query: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  protected async authorizeLinks (data: Struct, response: ServerResponse, user?: User): Promise<void> {
    const authKeys = [
      ...this.keys.foreign ?? [],
      ...this.keys.related ?? []
    ]

    await Promise.all(authKeys.map(async (authKey) => {
      const selectQuery = this.database.formatter.createSelectQuery(authKey.table, this.keys, [authKey], data, user)
      const object = await this.database.select(selectQuery.string, selectQuery.values)

      if (object === undefined) {
        response.statusCode = 404
        throw new Error('Object is undefined')
      }
    }))
  }

  protected async insert (query: Query, data: Struct, response: ServerResponse, user?: User): Promise<Struct | undefined> {
    await this.authorizeLinks(data, response, user)

    const insertQuery = this.database.formatter.createInsertQuery(this.object, this.schema.body.schema, this.keys, data, user)
    const object = await this.database.insert(insertQuery.string, insertQuery.values, null)

    await this.moveFiles(this.schema.body.schema, data)

    if (
      this.keys.primary?.length === 1 &&
      object[this.keys.primary[0].column] !== undefined
    ) {
      await this.insertLinks(data, object, this.keys.primary[0])
    }

    const selectOneQuery = this.database.formatter.createSelectOneQuery(this.object, this.schema.query.schema, this.keys, this.keys.primary ?? [], {
      select: query.select,
      where: object
    }, user)

    return this.database.select(selectOneQuery.string, selectOneQuery.values)
  }

  protected async insertLinks (data: Struct, object: Struct, primaryKey: SchemaFieldKey): Promise<void> {
    await Promise.all(this.keys.related?.map(async (key) => {
      const insertQuery = this.database.formatter.createInsertQuery(key.table, {
        [key.column]: {
          type: 'text'
        },
        [primaryKey.column]: {
          type: 'text'
        }
      }, this.keys, {
        [key.column]: data[key.column],
        [primaryKey.column]: object[primaryKey.column]
      })

      await this.database.insert(insertQuery.string, insertQuery.values, null)
    }) ?? [])
  }

  protected async moveFiles (schema: Schema, data: Struct): Promise<void> {
    await Promise.all(Object
      .entries(schema)
      .filter(([name, field]) => {
        return (
          field.type === 'file' &&
          data[name] !== undefined
        )
      })
      .map(async ([name]) => {
        const newFile = data[name]

        if (newFile instanceof ScolaFile) {
          const stream = await this.codec.bucket?.get(newFile)

          if (stream !== undefined) {
            await this.bucket?.put(newFile, stream)
            await this.codec.bucket?.delete(newFile)
          }
        }
      }))
  }
}
