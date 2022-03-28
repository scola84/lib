import type { Schema, SchemaFieldKey } from '../schema'
import { CrudHandler } from './crud'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'
import type { User } from '../../entities'
import { isFile } from '../../../common'

export abstract class CrudInsertHandler extends CrudHandler {
  public method = 'POST'

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

  protected async insert (data: Struct, response: ServerResponse, schema: Schema, user?: User): Promise<Struct | undefined> {
    await this.authorizeLinks(data, response, user)

    const insertQuery = this.database.formatter.createInsertQuery(this.object, this.keys, schema, data, user)
    const object = await this.database.insert(insertQuery.string, insertQuery.values, null)

    await this.moveFiles(schema, data)

    if (
      this.keys.primary?.length === 1 &&
      object[this.keys.primary[0].column] !== undefined
    ) {
      await this.insertLinks(data, object, this.keys.primary[0])
    }

    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], object, user)

    response.statusCode = 201
    return this.database.select(selectQuery.string, selectQuery.values)
  }

  protected async insertLinks (data: Struct, object: Struct, primaryKey: SchemaFieldKey): Promise<void> {
    await Promise.all(this.keys.related?.map(async (key) => {
      const insertQuery = this.database.formatter.createInsertQuery(key.table, this.keys, {
        [key.column]: {
          type: 'text'
        },
        [primaryKey.column]: {
          type: 'text'
        }
      }, {
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

        if (isFile(newFile)) {
          const stream = await this.codec.bucket?.get(newFile)

          if (stream !== undefined) {
            await this.bucket?.put(newFile, stream)
            await this.codec.bucket?.delete(newFile)
          }
        }
      }))
  }
}