import { Builder, Parser } from 'xml2js'
import type { IncomingMessage, ServerResponse } from 'http'
import { ScolaFile, Struct, cast, isPrimitive, isStruct, revive, setPush } from '../../../common'
import type { FileBucket } from '../file'
import type { FileInfo } from 'busboy'
import type { Readable } from 'stream'
import type { Schema } from '../schema'
import { Writable } from 'stream'
import accepts from 'accepts'
import busboy from 'busboy'
import { parse } from 'content-type'
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

    const contentType = parse(request).type

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
      case 'application/xml':
        body = await this.decodeXml(request)
        break
      case 'multipart/form-data':
        body = await this.decodeFormData(request, schema)
        break
      case 'text/plain':
        body = await this.decodePlain(request)
        break
      case 'text/xml':
        body = await this.decodeXml(request)
        break
      default:
        throw new Error('Content unsupported')
    }

    return body ?? undefined
  }

  public async decodeFormData (request: IncomingMessage, schema?: Schema): Promise<Struct> {
    return new Promise((resolve, reject) => {
      const body = Struct.create()

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

    const file = new ScolaFile({
      id: randomUUID(),
      name: info.filename,
      size: 0,
      type: info.mimeType
    })

    stream.on('data', (data) => {
      if (Buffer.isBuffer(data)) {
        file.size += data.length
      }
    })

    setPush(body, name, file)
    this.bucket?.put(file, stream)
  }

  public async decodeFormUrlencoded (request: IncomingMessage): Promise<Struct> {
    return Struct.fromQuery(await this.decodePlain(request), true)
  }

  public async decodeJson (request: IncomingMessage): Promise<unknown> {
    return JSON.parse(await this.decodePlain(request), revive) as unknown
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

  public async decodeXml (request: IncomingMessage): Promise<string> {
    return new Parser().parseStringPromise(await this.decodePlain(request)) as Promise<string>
  }

  public encode (data: unknown, response: ServerResponse, request?: IncomingMessage): string {
    let body = ''
    let contentType: unknown = null

    if (response.hasHeader('content-type')) {
      contentType = response.getHeader('content-type')
    } else if (request !== undefined) {
      contentType = accepts(request).type([
        'application/json',
        'application/xml',
        'text/xml',
        'text/html',
        'text/plain'
      ])
    }

    switch (contentType) {
      case 'application/json':
        body = this.encodeJson(data)
        break
      case 'application/xml':
        body = this.encodeXml(data)
        break
      case 'text/event-stream':
        body = this.encodeEventStream(data)
        break
      case 'text/html':
        body = this.encodeHtml(data)
        break
      case 'text/plain':
        body = this.encodePlain(data)
        break
      case 'text/xml':
        body = this.encodeXml(data)
        break
      default:
        throw new Error('Content is not acceptable')
    }

    if (!response.headersSent) {
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

  public encodeHtml (data: unknown): string {
    return String(data)
  }

  public encodeJson (data: unknown): string {
    return JSON.stringify(data)
  }

  public encodePlain (data: unknown): string {
    return String(data)
  }

  public encodeXml (data: unknown): string {
    return new Builder().buildObject(data)
  }

  protected discardStream (stream: Readable): void {
    stream.pipe(new Writable({
      write (chunk, encoding, callback) {
        callback()
      }
    }))
  }
}
