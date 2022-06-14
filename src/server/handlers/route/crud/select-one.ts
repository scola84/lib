import type { Schema, SchemaField } from '../../../helpers/schema'
import { ScolaError, Struct, cast, isFile, isSame, toString } from '../../../../common'
import { CrudHandler } from './crud'
import type { Merge } from 'type-fest'
import type { Query } from '../../../../common'
import type { Readable } from 'stream'
import type { RouteData } from '../../../helpers/route'
import type { ServerResponse } from 'http'

interface CrudSelectOneData extends RouteData {
  query: Query
}

export abstract class CrudSelectOneHandler extends CrudHandler {
  public method = 'GET'

  public abstract schema: {
    query: Merge<SchemaField, {
      required: true
      schema: Schema
      type: 'struct'
    }>
  }

  public async handle (data: CrudSelectOneData, response: ServerResponse): Promise<unknown> {
    const selectOneQuery = this.database.formatter.createSelectOneQuery(this.object, this.schema.query.schema, this.keys, this.keys.primary ?? [], data.query, data.user)
    const object = await this.database.select(selectOneQuery.string, selectOneQuery.values)

    if (object === undefined) {
      throw new ScolaError({
        code: 'err_select',
        message: 'Object is undefined',
        status: 404
      })
    }

    if (
      this.keys.modified !== undefined &&
      object[this.keys.modified.column] !== null &&
      data.query.where?.[this.keys.modified.column] !== undefined &&
      isSame(cast(object[this.keys.modified.column]), cast(data.query.where[this.keys.modified.column]))
    ) {
      response.statusCode = 304
      return undefined
    }

    if (typeof data.query.where?.file === 'string') {
      let file = object[data.query.where.file]

      if (typeof file === 'string') {
        file = Struct.fromJson(file)
      }

      if (file === null) {
        throw new ScolaError({
          code: 'err_select',
          message: 'File is null',
          status: 404
        })
      }

      if (isFile(file)) {
        const stream = await this.bucket?.get(file)

        if (stream === undefined) {
          throw new ScolaError({
            code: 'err_select',
            message: 'Stream is undefined',
            status: 404
          })
        }

        if (data.query.disposition === 'attachment') {
          response.setHeader('content-disposition', `attachment; filename="${file.name}"`)
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
      }, toString(error))
    })

    stream.once('end', () => {
      stream.removeAllListeners()
    })

    stream.pipe(response)
  }
}
