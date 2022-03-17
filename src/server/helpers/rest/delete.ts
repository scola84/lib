import type { Schema, SchemaField } from '../schema'
import { isFile, parseStruct } from '../../../common'
import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

interface DeleteData extends RouteData {}

export abstract class RestDeleteHandler extends RestHandler {
  protected async deleteFile (object: Struct, name: string): Promise<void> {
    const file = parseStruct(object[name])

    if (!isFile(file)) {
      throw new Error(`File is undefined for "DELETE ${this.url}"`)
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

    const updateQuery = this.database.formatter.createUpdatePartialQuery(this.object, this.keys, schema, data)

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

  protected async handle (data: DeleteData, response: ServerResponse): Promise<Struct | undefined> {
    if (
      this.keys.auth !== undefined &&
      data.user === undefined
    ) {
      response.statusCode = 401
      throw new Error(`User is undefined for "DELETE ${this.url}"`)
    }

    const schema = this.schema.query

    if (schema === undefined) {
      throw new Error(`Schema is undefined for "DELETE ${this.url}"`)
    }

    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.query, data.user)
    const object = await this.database.select(selectQuery.string, selectQuery.values)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error(`Object is undefined for "DELETE ${this.url}"`)
    }

    if (typeof data.query.file === 'string') {
      await this.deleteFile(object, data.query.file)
      return object
    }

    await this.deleteFiles(schema, object)

    const deleteQuery = this.database.formatter.createDeleteQuery(this.object, this.keys, data.query)

    await this.database.delete(deleteQuery.string, deleteQuery.values)
    return object
  }
}
