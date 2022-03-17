import { isFile, parseStruct } from '../../../common'
import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { Schema } from '../schema'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

interface PatchData extends RouteData {
  body: Struct
}

export abstract class RestPatchHandler extends RestHandler {
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

  protected async handle (data: PatchData, response: ServerResponse): Promise<Struct | undefined> {
    if (
      this.keys.auth !== undefined &&
      data.user === undefined
    ) {
      response.statusCode = 401
      throw new Error(`User is undefined for "PATCH ${this.url}"`)
    }

    const schema = this.schema.body

    if (schema === undefined) {
      throw new Error(`Schema is undefined for "PATCH ${this.url}"`)
    }

    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.body, data.user)
    const object = await this.database.select(selectQuery.string, selectQuery.values)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error(`Object is undefined for "PATCH ${this.url}"`)
    }

    const updatePartialQuery = this.database.formatter.createUpdatePartialQuery(this.object, this.keys, schema, data.body)

    await this.deleteFiles(schema, object, data.body)
    await this.database.update(updatePartialQuery.string, updatePartialQuery.values)
    return this.database.select(selectQuery.string, selectQuery.values)
  }
}
