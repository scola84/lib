import type { Query, User } from '../../../../common'
import type { Schema, SchemaField } from '../../../helpers/schema'
import { ScolaError, Struct, cast, isFile, isSame } from '../../../../common'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'

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

  protected async delete (query: Query, data: Struct, user?: User): Promise<Struct | undefined> {
    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], {
      where: data
    }, user)

    const object = await this.database.select(selectQuery.string, selectQuery.values)

    if (object === undefined) {
      throw new ScolaError({
        code: 'err_delete',
        message: 'Object is undefined',
        status: 404
      })
    }

    if (
      this.keys.modified !== undefined &&
      object[this.keys.modified.column] !== null &&
      data[this.keys.modified.column] !== undefined &&
      !isSame(cast(object[this.keys.modified.column]), cast(data[this.keys.modified.column]))
    ) {
      throw new ScolaError({
        code: 'err_delete',
        message: 'Object is modified',
        status: 412
      })
    }

    if (typeof data.file === 'string') {
      await this.deleteFile(object, data.file, user)
      return this.database.select(selectQuery.string, selectQuery.values)
    }

    try {
      await this.deleteFiles(this.schema.body.schema, object)
    } catch (error: unknown) {
      //
    }

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
