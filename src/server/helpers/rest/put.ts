import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { Schema } from '../schema'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'
import { isFile } from '../../../common'

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
        const file = object[name]

        if (isFile(file)) {
          await this.codec.bucket?.delete(file.id)
        }
      }))
  }

  protected async handle (data: PutData, response: ServerResponse): Promise<void> {
    const schema = this.schema.body

    if (schema === undefined) {
      throw new Error(`Schema is undefined for "${this.object}"`)
    }

    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.body, data.user)
    const object = await this.database.execute<Struct, Struct | undefined>(selectQuery)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error(`PUT is not allowed for "${this.object}"`)
    }

    await this.deleteFiles(schema, object, data.body)

    const updateQuery = this.database.formatter.createUpdateQuery(this.object, this.keys, schema, data.body)

    await this.database.execute(updateQuery)
  }
}
