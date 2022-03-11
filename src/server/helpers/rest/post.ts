import type { SqlId, SqlInsertResult } from '../sql'
import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { SchemaFieldKey } from '../schema'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

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
      const keyQuery = this.database.formatter.createSelectQuery(authKey.table, this.keys, [authKey], data.body, data.user)
      const object = await this.database.execute<Struct, Struct | undefined>(keyQuery)

      if (object === undefined) {
        response.statusCode = 404
        throw new Error(`POST is not allowed for "${this.object}"`)
      }
    }))
  }

  protected async handle (data: PostData, response: ServerResponse): Promise<unknown> {
    const schema = this.schema.body

    if (schema === undefined) {
      throw new Error(`Schema is undefined for "${this.object}"`)
    }

    await this.authorizeLinks(data, response)

    const query = this.database.formatter.createInsertQuery(this.object, schema, data.body)
    const { id } = await this.database.execute<Struct, SqlInsertResult>(query)
    const primaryKey = this.keys.primary?.[0]

    if (
      id === undefined ||
      primaryKey === undefined
    ) {
      return undefined
    }

    await this.insertLinks(data, primaryKey, id)

    const result = {
      [primaryKey.column]: id
    }

    return result
  }

  protected async insertLinks (data: PostData, primaryKey: SchemaFieldKey, id: SqlId): Promise<void> {
    await Promise.all(this.keys.related?.map(async (key) => {
      const keyQuery = this.database.formatter.createInsertQuery(key.table, {
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

      await this.database.execute(keyQuery)
    }) ?? [])
  }
}
