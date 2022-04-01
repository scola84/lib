import { cast, isFile, parseStruct, toString } from '../../../common'
import { CrudHandler } from './crud'
import type { Readable } from 'stream'
import type { RouteData } from '../route'
import type { SchemaField } from '../schema'
import type { ServerResponse } from 'http'

export abstract class CrudSelectOneHandler extends CrudHandler {
  public method = 'GET'

  public abstract schema: {
    query: SchemaField
  }

  public async handle (data: RouteData, response: ServerResponse): Promise<unknown> {
    const selectQuery = this.database.formatter.createSelectQuery(this.object, this.keys, this.keys.primary ?? [], data.query, data.user)
    const object = await this.database.select(selectQuery.string, selectQuery.values)

    if (object === undefined) {
      response.statusCode = 404
      throw new Error('Object is undefined')
    }

    if (
      this.keys.modified !== undefined &&
      object[this.keys.modified.column] !== null &&
      data.query[this.keys.modified.column] !== undefined &&
      cast(object[this.keys.modified.column])?.toString() === cast(data.query[this.keys.modified.column])?.toString()
    ) {
      response.statusCode = 304
      return undefined
    }

    if (typeof data.query.file === 'string') {
      const file = parseStruct(object[data.query.file])

      if (file === null) {
        response.statusCode = 404
        throw new Error('File is null')
      }

      if (isFile(file)) {
        const stream = await this.bucket?.get(file)

        if (stream === undefined) {
          response.statusCode = 404
          throw new Error('Stream is undefined')
        }

        response.setHeader('content-disposition', `attachment; filename="${file.name}"`)
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
      }, toString(error))
    })

    stream.once('end', () => {
      stream.removeAllListeners()
    })

    stream.pipe(response)
  }
}
