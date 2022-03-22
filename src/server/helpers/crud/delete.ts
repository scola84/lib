import type { Schema, SchemaField } from '../schema'
import { cast, isFile, parseStruct } from '../../../common'
import { CrudHandler } from './crud'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'
import type { User } from '../../entities'

export abstract class CrudDeleteHandler extends CrudHandler {
  public method = 'POST'

  protected async delete (data: Struct, response: ServerResponse, schema: Schema, user?: User): Promise<Struct | undefined> {
    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data, user)
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
      return object
    }

    await this.deleteFiles(schema, object)

    const deleteQuery = this.database.formatter.createDeleteQuery(this.object, this.keys, data)

    await this.database.delete(deleteQuery.string, deleteQuery.values)
    return object
  }

  protected async deleteFile (object: Struct, name: string, user?: User): Promise<void> {
    const file = parseStruct(object[name])

    if (!isFile(file)) {
      throw new Error('File is undefined')
    }

    await this.bucket?.delete(file)

    const data: Struct = {
      [name]: null
    }

    const schema: Struct<SchemaField> = {
      [name]: {
        type: 'file'
      }
    }

    this.keys.primary?.forEach((key) => {
      data[key.column] = object[key.column]

      schema[key.column] = {
        type: 'number'
      }
    })

    const updateQuery = this.database.formatter.createUpdatePartialQuery(this.object, this.keys, schema, data, user)

    await this.database.update(updateQuery.string, updateQuery.values)
  }

  protected async deleteFiles (schema: Schema, object: Struct): Promise<void> {
    await Promise.all(Object
      .entries(schema)
      .filter(([,field]) => {
        return field.type === 'file'
      })
      .map(async ([name]) => {
        const file = parseStruct(object[name])

        if (isFile(file)) {
          await this.bucket?.delete(file)
        }
      }))
  }
}
