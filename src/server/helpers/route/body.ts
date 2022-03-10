import type { IncomingMessage, ServerResponse } from 'http'
import { cast, isArray, isPrimitive, isStruct, setPush } from '../../../common'
import type { Bucket } from '../file'
import type { Struct } from '../../../common'
import busboy from 'busboy'
import { parse } from 'querystring'
import { randomUUID } from 'crypto'

export interface BodyOptions {
  bucket?: Bucket
}

export class Body {
  public bucket?: Bucket

  public constructor (options: BodyOptions) {
    this.bucket = options.bucket
  }

  public format (data: unknown, response?: ServerResponse): string {
    let body = ''

    const [contentType] = response
      ?.getHeader('content-type')
      ?.toString()
      .split(';') ?? []

    switch (contentType) {
      case 'application/json':
        body = this.formatJson(data)
        break
      case 'text/event-stream':
        body = this.formatEventStream(data)
        break
      case 'text/html':
        body = String(data)
        break
      default:
        break
    }

    if (response?.headersSent === false) {
      response.setHeader('content-length', body.length.toString())
    }

    return body
  }

  public formatEventStream (data: unknown): string {
    let body = ''

    if (isStruct(data)) {
      if (isPrimitive(data.data)) {
        body += `data: ${data.data.toString()}\n`
      }

      if (isPrimitive(data.event)) {
        body += `event: ${data.event.toString()}\n`
      }

      if (isPrimitive(data.id)) {
        body += `id: ${data.id.toString()}\n`
      }

      if (isPrimitive(data.retry)) {
        body += `retry: ${data.retry.toString()}\n`
      }
    }

    if (body.length === 0) {
      return ''
    }

    return `${body}\n`
  }

  public formatJson (data: unknown): string {
    return JSON.stringify(data)
  }

  public async parse (request: IncomingMessage): Promise<unknown> {
    let body: unknown = null

    const [contentType] = request.headers['content-type']?.split(';') ?? []

    switch (contentType) {
      case 'application/json':
        body = await this.parseJson(request)
        break
      case 'application/x-www-form-urlencoded':
        body = await this.parseFormUrlencoded(request)
        break
      case 'multipart/form-data':
        body = await this.parseFormData(request)
        break
      case 'application/octet-stream':
        body = await this.parseOctetStream(request)
        break
      case 'text/plain':
        body = await this.parsePlain(request)
        break
      default:
        break
    }

    return body
  }

  public async parseFormData (request: IncomingMessage): Promise<Struct> {
    return new Promise((resolve, reject) => {
      const body: Struct = {}

      const parser = busboy({
        headers: request.headers
      })

      parser.on('error', (error) => {
        parser.removeAllListeners()
        parser.destroy()
        reject(error)
      })

      parser.on('field', (name, value) => {
        setPush(body, name, cast(value))
      })

      parser.on('file', (name, stream, info) => {
        const file = {
          id: randomUUID(),
          name: info.filename,
          size: 0,
          type: info.mimeType
        }

        setPush(body, name, file)

        stream.on('data', (data) => {
          if (Buffer.isBuffer(data)) {
            file.size += data.length
          }
        })

        this.bucket?.put(file.id, stream)
      })

      parser.on('close', () => {
        parser.removeAllListeners()
        parser.destroy()
        resolve(body)
      })

      request.pipe(parser)
    })
  }

  public parseFormDataField (body: Struct, name: string, value: string): void {
    const castValue = cast(value)

    if (body[name] === undefined) {
      body[name] = castValue
    } else {
      let bodyValue = body[name]

      if (!isArray(bodyValue)) {
        body[name] = [body[name]]
        bodyValue = body[name]
      }

      if (isArray(bodyValue)) {
        bodyValue.push(castValue)
      }
    }
  }

  public async parseFormUrlencoded (request: IncomingMessage): Promise<Struct> {
    return {
      ...parse(await this.parsePlain(request))
    }
  }

  public async parseJson (request: IncomingMessage): Promise<unknown> {
    return JSON.parse(await this.parsePlain(request)) as unknown
  }

  public async parseOctetStream (request: IncomingMessage): Promise<Buffer> {
    let body = Buffer.from([])

    for await (const data of request) {
      if (Buffer.isBuffer(data)) {
        body = Buffer.concat([body, data])
      }
    }

    return body
  }

  public async parsePlain (request: IncomingMessage): Promise<string> {
    let body = ''

    for await (const data of request) {
      body += String(data)
    }

    return body
  }
}
