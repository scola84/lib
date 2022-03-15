import { isFile, parseStruct } from '../../../common'
import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { Schema } from '../schema'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

interface PutData extends RouteData {
  body: Struct
}

export abstract class RestPutHandler extends RestHandler {
  protected async deleteFiles (schema: Schema, object: Struct, body: Struct): Promise<void> {
    await Promise.all(Object
      .entries(schema)
      .filter(([name, field]) => {
        return (
          field.type === 'file' &&
          body[name] !== undefined
        )
      })
      .map(async ([name]) => {
        const oldFile = parseStruct(object[name])
        const newFile = body[name]

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

  protected async handle (data: PutData, response: ServerResponse): Promise<void> {
    if (
      this.keys.auth !== undefined &&
      data.user === undefined
    ) {
      response.statusCode = 401
      throw new Error(`User is undefined for "PUT ${this.url}"`)
    }

    const schema = this.schema.body

    if (schema === undefined) {
      throw new Error(`Schema is undefined for "PUT ${this.url}"`)
    }

    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.body, data.user)
    const object = await this.database.select(selectQuery.string, selectQuery.values)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error(`Object is undefined for "PUT ${this.url}"`)
    }

    await this.deleteFiles(schema, object, data.body)

    const updateQuery = this.database.formatter.createUpdateQuery(this.object, this.keys, schema, data.body)

    await this.database.update(updateQuery.string, updateQuery.values)
  }
}
