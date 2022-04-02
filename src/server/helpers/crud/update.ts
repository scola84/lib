import { Struct, cast, isFile } from '../../../common'
import { CrudHandler } from './crud'
import type { Schema } from '../schema'
import type { ServerResponse } from 'http'
import type { User } from '../../entities'

export abstract class CrudUpdateHandler extends CrudHandler {
  public method = 'POST'

  protected async deleteFiles (schema: Schema, object: Struct, data: Struct): Promise<void> {
    await Promise.all(Object
      .entries(schema)
      .filter(([name, field]) => {
        return (
          field.type === 'file' &&
          data[name] !== undefined
        )
      })
      .map(async ([name]) => {
        let oldFile = object[name]

        if (typeof oldFile === 'string') {
          oldFile = Struct.fromJson(oldFile)
        }

        const newFile = data[name]

        if (isFile(oldFile)) {
          await this.bucket?.delete(oldFile)
        }

        if (isFile(newFile)) {
          const stream = await this.codec.bucket?.get(newFile)

          if (stream !== undefined) {
            await this.bucket?.put(newFile, stream)
            await this.codec.bucket?.delete(newFile)
          }
        }
      }))
  }

  protected async update (data: Struct, response: ServerResponse, schema: Schema, user?: User): Promise<Struct | undefined> {
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

    const updateQuery = this.database.formatter.createUpdateQuery(this.object, schema, this.keys, data, user)

    await this.deleteFiles(schema, object, data)
    await this.database.update(updateQuery.string, updateQuery.values)
    return this.database.select(selectQuery.string, selectQuery.values)
  }
}
