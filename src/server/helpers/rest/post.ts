import type { Schema, SchemaFieldKey } from '../schema'
import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'
import { isFile } from '../../../common'

interface PostData extends RouteData {
  body: Struct
}

export abstract class RestPostHandler extends RestHandler {
  protected async authorizeLinks (data: PostData, response: ServerResponse): Promise<void> {
    const authKeys = [
      ...this.keys.foreign ?? [],
      ...this.keys.related ?? []
    ]

    await Promise.all(authKeys.map(async (authKey) => {
      const selectQuery = this.database.formatter.createSelectQuery(authKey.table, this.keys, [authKey], data.body, data.user)
      const object = await this.database.select(selectQuery.string, selectQuery.values)

      if (object === undefined) {
        response.statusCode = 404
        throw new Error(`Object is undefined for "POST ${this.url}"`)
      }
    }))
  }

  protected async handle (data: PostData, response: ServerResponse): Promise<unknown> {
    if (
      this.keys.auth !== undefined &&
      data.user === undefined
    ) {
      response.statusCode = 401
      throw new Error(`User is undefined for "POST ${this.url}"`)
    }

    const schema = this.schema.body

    if (schema === undefined) {
      throw new Error(`Schema is undefined for "POST ${this.url}"`)
    }

    await this.authorizeLinks(data, response)

    const insertQuery = this.database.formatter.createInsertQuery(this.object, this.keys, schema, data.body)
    const { id } = await this.database.insert(insertQuery.string, insertQuery.values)

    await this.moveFiles(schema, data.body)

    if (
      id !== undefined &&
      this.keys.primary?.length === 1
    ) {
      const [primaryKey] = this.keys.primary

      await this.insertLinks(data, primaryKey, id)

      const result = {
        [primaryKey.column]: id
      }

      return result
    }

    return undefined
  }

  protected async insertLinks (data: PostData, primaryKey: SchemaFieldKey, id: unknown): Promise<void> {
    await Promise.all(this.keys.related?.map(async (key) => {
      const insertQuery = this.database.formatter.createInsertQuery(key.table, this.keys, {
        [key.column]: {
          type: 'text'
        },
        [primaryKey.column]: {
          type: 'text'
        }
      }, {
        [key.column]: data.body[key.column],
        [primaryKey.column]: id
      })

      await this.database.insert(insertQuery.string, insertQuery.values)
    }) ?? [])
  }

  protected async moveFiles (schema: Schema, body: Struct): Promise<void> {
    await Promise.all(Object
      .entries(schema)
      .filter(([name, field]) => {
        return (
          field.type === 'file' &&
          body[name] !== undefined
        )
      })
      .map(async ([name]) => {
        const newFile = body[name]

        if (isFile(newFile)) {
          const stream = await this.codec.bucket?.get(newFile)

          if (stream !== undefined) {
            await this.bucket?.put(newFile, stream)
            await this.codec.bucket?.delete(newFile)
          }
        }
      }))
  }
}
