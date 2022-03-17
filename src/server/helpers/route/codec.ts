import type { IncomingMessage, ServerResponse } from 'http'
import { cast, isPrimitive, isStruct, setPush } from '../../../common'
import type { FileBucket } from '../file'
import type { FileInfo } from 'busboy'
import type { Readable } from 'stream'
import type { Schema } from '../schema'
import type { Struct } from '../../../common'
import { Writable } from 'stream'
import busboy from 'busboy'
import { parse } from 'querystring'
import { randomUUID } from 'crypto'

export interface RouteCodecOptions {
  bucket?: FileBucket
}

export class RouteCodec {
  public bucket?: FileBucket

  public constructor (options: RouteCodecOptions) {
    this.bucket = options.bucket
  }

  public async decode (request: IncomingMessage, schema?: Schema): Promise<unknown> {
    let body: unknown = null

    const [contentType] = request.headers['content-type']?.split(';') ?? []

    switch (contentType) {
      case 'application/json':
        body = await this.decodeJson(request)
        break
      case 'application/octet-stream':
        body = await this.decodeOctetStream(request)
        break
      case 'application/x-www-form-urlencoded':
        body = await this.decodeFormUrlencoded(request)
        break
      case 'multipart/form-data':
        body = await this.decodeFormData(request, schema)
        break
      case 'text/plain':
        body = await this.decodePlain(request)
        break
      default:
        break
    }

    return body
  }

  public async decodeFormData (request: IncomingMessage, schema?: Schema): Promise<Struct> {
    return new Promise((resolve, reject) => {
      const body: Struct = {}

      const decoder = busboy({
        headers: request.headers
      })

      decoder.on('error', (error) => {
        decoder.removeAllListeners()
        decoder.destroy()
        reject(error)
      })

      decoder.on('field', (name, value) => {
        this.decodeFormDataField(name, value, body)
      })

      decoder.on('file', (name, stream, info) => {
        this.decodeFormDataFile(name, stream, info, body, schema)
      })

      decoder.on('close', () => {
        decoder.removeAllListeners()
        decoder.destroy()
        resolve(body)
      })

      request.pipe(decoder)
    })
  }

  public decodeFormDataField (name: string, value: unknown, body: Struct): void {
    let castValue = cast(value)

    if (castValue === '') {
      castValue = null
    }

    setPush(body, name, castValue)
  }

  public decodeFormDataFile (name: string, stream: Readable, info: FileInfo, body: Struct, schema?: Schema): void {
    if (schema?.[name] === undefined) {
      this.discardStream(stream)
      return
    }

    const file = {
      id: randomUUID(),
      name: info.filename,
      size: 0,
      type: info.mimeType
    }

    stream.on('data', (data) => {
      if (Buffer.isBuffer(data)) {
        file.size += data.length
      }
    })

    setPush(body, name, file)
    this.bucket?.put(file, stream)
  }

  public async decodeFormUrlencoded (request: IncomingMessage): Promise<Struct> {
    return Object
      .entries({
        ...parse(await this.decodePlain(request))
      })
      .reduce<Struct>((result, [name, value]) => {
      /* eslint-disable @typescript-eslint/indent */
        let castValue: unknown = null

        if (isPrimitive(value)) {
          if (value === '') {
            castValue = null
          } else {
            castValue = cast(value)
          }
        } else if (Array.isArray(value)) {
          castValue = value.map((mapValue) => {
            if (mapValue === '') {
              return null
            }

            return cast(mapValue)
          })
        }

        return {
          [name]: castValue,
          ...result
        }
      }, {})
      /* eslint-disable @typescript-eslint/indent */
  }

  public async decodeJson (request: IncomingMessage): Promise<unknown> {
    return JSON.parse(await this.decodePlain(request)) as unknown
  }

  public async decodeOctetStream (request: IncomingMessage): Promise<Buffer> {
    let body = Buffer.from([])

    for await (const data of request) {
      if (Buffer.isBuffer(data)) {
        body = Buffer.concat([body, data])
      }
    }

    return body
  }

  public async decodePlain (request: IncomingMessage): Promise<string> {
    let body = ''

    for await (const data of request) {
      body += String(data)
    }

    return body
  }

  public encode (data: unknown, response?: ServerResponse): string {
    let body = ''

    const [contentType] = response
      ?.getHeader('content-type')
      ?.toString()
      .split(';') ?? []

    switch (contentType) {
      case 'application/json':
        body = this.encodeJson(data)
        break
      case 'text/event-stream':
        body = this.encodeEventStream(data)
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

  public encodeEventStream (data: unknown): string {
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

  public encodeJson (data: unknown): string {
    return JSON.stringify(data)
  }

  protected discardStream (stream: Readable): void {
    stream.pipe(new Writable({
      write (chunk, encoding, callback) {
        callback()
      }
    }))
  }
}
