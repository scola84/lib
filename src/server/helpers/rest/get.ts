import { isFile, parseStruct } from '../../../common'
import type { Readable } from 'stream'
import { RestHandler } from './rest'
import type { RouteData } from '../route'
import type { ServerResponse } from 'http'
import type { Struct } from '../../../common'

interface GetData extends RouteData {}

export abstract class RestGetHandler extends RestHandler {
  protected async handle (data: GetData, response: ServerResponse): Promise<Struct | null | undefined> {
    if (
      this.keys.auth !== undefined &&
      data.user === undefined
    ) {
      response.statusCode = 401
      throw new Error(`User is undefined for "GET ${this.url}"`)
    }

    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.query, data.user)
    const object = await this.database.select(selectQuery.string, selectQuery.values)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error(`Object is undefined for "GET ${this.url}"`)
    }

    if (typeof data.query.file === 'string') {
      const file = parseStruct(object[data.query.file])

      if (file === null) {
        response.statusCode = 404
        throw new Error(`File is null for "GET ${this.url}"`)
      }

      if (isFile(file)) {
        const stream = await this.bucket?.get(file)

        if (stream === undefined) {
          response.statusCode = 404
          throw new Error(`Stream is undefined for "GET ${this.url}"`)
        }

        response.setHeader('content-type', file.type)
        this.pipeStream(stream, response)
        return null
      }
    }

    return object
  }

  protected pipeStream (stream: Readable, response: ServerResponse): void {
    stream.once('error', (error) => {
      if (!response.headersSent) {
        response.statusCode = 500
        response.removeHeader('content-type')
      }

      response.end()
      stream.removeAllListeners()

      this.logger?.error({
        context: 'pipe-stream'
      }, String(error))
    })

    stream.once('end', () => {
      stream.removeAllListeners()
    })

    stream.pipe(response)
  }
}
