import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'
import { isFile } from '../../../common'

interface GetData extends RouteData {}

export abstract class RestGetHandler extends RestHandler {
  protected async handle (data: GetData, response: ServerResponse): Promise<unknown> {
    const query = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.query, data.user)
    const object = await this.database.execute<Struct, Struct | undefined>(query)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error(`Object is undefined for "${this.object}"`)
    }

    if (typeof data.query.file === 'string') {
      const file = object[data.query.file]

      if (file === undefined) {
        response.statusCode = 404
        throw new Error(`Object is undefined for "${this.object}"`)
      }

      if (isFile(file)) {
        const stream = await this.codec.bucket?.get(file.id)

        if (stream === undefined) {
          response.statusCode = 404
          throw new Error(`Stream is undefined for "${this.object}"`)
        }

        response.setHeader('content-type', file.type)
        stream.pipe(response)
        return null
      }
    }

    return object
  }
}
