import type { Schema, SchemaField } from '../../../helpers/schema'
import { ScolaFile, Struct, cast, isFile } from '../../../../common'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'
import type { Query } from '../../../../common'
import type { ServerResponse } from 'http'
import type { User } from '../../../entities'

export abstract class CrudUpdateHandler extends CrudHandler {
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

  protected async moveFiles (schema: Schema, object: Struct, data: Struct): Promise<void> {
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

            let oldFile = object[name]

            if (typeof oldFile === 'string') {
              oldFile = Struct.fromJson(oldFile)
            }

            if (isFile(oldFile)) {
              await this.bucket?.delete(oldFile)
            }
          }
        }
      }))
  }

  protected async update (query: Query, data: Struct, response: ServerResponse, user?: User): Promise<Struct | undefined> {
    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], {
      where: data
    }, user)

    const object = await this.database.select(selectQuery.string, selectQuery.values)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error('Object is undefined')
    }

    if (
      this.keys.modified !== undefined &&
      object[this.keys.modified.column] !== null &&
      data[this.keys.modified.column] !== undefined &&
      cast(object[this.keys.modified.column])?.toString() !== cast(data[this.keys.modified.column])?.toString()
    ) {
      response.statusCode = 412
      throw new Error('Object is modified')
    }

    const updateQuery = this.database.formatter.createUpdateQuery(this.object, this.schema.body.schema, this.keys, data, user)

    try {
      await this.moveFiles(this.schema.body.schema, object, data)
    } catch (error: unknown) {
      //
    }

    await this.database.update(updateQuery.string, updateQuery.values)

    const selectOneQuery = this.database.formatter.createSelectOneQuery(this.object, this.schema.query.schema, this.keys, this.keys.primary ?? [], {
      select: query.select,
      where: object
    }, user)

    return this.database.select(selectOneQuery.string, selectOneQuery.values)
  }
}