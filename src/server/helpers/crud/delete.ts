import type { Schema, SchemaField } from '../schema'
import { Struct, cast, isFile } from '../../../common'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'
import type { Query } from '../../../common'
import type { ServerResponse } from 'http'
import type { User } from '../../entities'

export abstract class CrudDeleteHandler extends CrudHandler {
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

  protected async delete (query: Query, data: Struct, response: ServerResponse, user?: User): Promise<Struct | undefined> {
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

    if (typeof data.file === 'string') {
      await this.deleteFile(object, data.file, user)
      return this.database.select(selectQuery.string, selectQuery.values)
    }

    await this.deleteFiles(this.schema.body.schema, object)

    const deleteQuery = this.database.formatter.createDeleteQuery(this.object, this.keys, data)

    await this.database.delete(deleteQuery.string, deleteQuery.values)

    const selectOneQuery = this.database.formatter.createSelectOneQuery(this.object, this.schema.query.schema, this.keys, this.keys.primary ?? [], query, user)
    return this.database.select(selectOneQuery.string, selectOneQuery.values)
  }

  protected async deleteFile (object: Struct, name: string, user?: User): Promise<void> {
    let file = object[name]

    if (typeof file === 'string') {
      file = Struct.fromJson(file)
    }

    if (isFile(file)) {
      await this.bucket?.delete(file)

      const data = Struct.create({
        [name]: null
      })

      const schema = Struct.create<Struct<SchemaField>>({
        [name]: {
          type: 'file'
        }
      })

      this.keys.primary?.forEach((key) => {
        data[key.column] = object[key.column]

        schema[key.column] = {
          type: 'number'
        }
      })

      const updateQuery = this.database.formatter.createUpdateQuery(this.object, schema, this.keys, data, user)

      await this.database.update(updateQuery.string, updateQuery.values)
    }
  }

  protected async deleteFiles (schema: Schema, object: Struct): Promise<void> {
    await Promise.all(Object
      .entries(schema)
      .filter(([,field]) => {
        return field.type === 'file'
      })
      .map(async ([name]) => {
        let file = object[name]

        if (typeof file === 'string') {
          file = Struct.fromJson(file)
        }

        if (isFile(file)) {
          await this.bucket?.delete(file)
        }
      }))
  }
}
