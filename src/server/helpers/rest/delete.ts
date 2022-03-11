import type { File, Struct } from '../../../common'
import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { Schema } from '../schema'
import type { ServerResponse } from 'http'
import { isFile } from '../../../common'

interface DeleteData extends RouteData {}

export abstract class RestDeleteHandler extends RestHandler {
  protected async deleteFile (file: File): Promise<void> {
    await this.codec.bucket?.delete(file.id)
  }

  protected async deleteFiles (schema: Schema, object: Struct): Promise<void> {
    await Promise.all(Object
      .entries(schema)
      .filter(([,field]) => {
        return field.type === 'file'
      })
      .map(async ([name]) => {
        const file = object[name]

        if (isFile(file)) {
          await this.deleteFile(file)
        }
      }))
  }

  protected async handle (data: DeleteData, response: ServerResponse): Promise<void> {
    const schema = this.schema.query

    if (schema === undefined) {
      throw new Error(`Schema is undefined for "${this.object}"`)
    }

    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.query, data.user)
    const object = await this.database.execute<Struct, Struct | undefined>(selectQuery)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error(`DELETE is not allowed for "${this.object}"`)
    }

    if (typeof data.query.file === 'string') {
      const file = object[data.query.file]

      if (isFile(file)) {
        await this.deleteFile(file)
      } else {
        throw new Error(`File is undefined for "${this.object}"`)
      }

      return
    }

    await this.deleteFiles(schema, object)

    const deleteQuery = this.database.formatter.createDeleteQuery(this.object, this.keys, data.query)

    await this.database.execute(deleteQuery)
  }
}
