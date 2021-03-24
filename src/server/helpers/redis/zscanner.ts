import { Readable } from 'stream'
import type { ReadableOptions } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'

export interface ZScannerOptions extends ReadableOptions {
  cursor: string
  del: boolean
  key: string
  queueWriter: WrappedNodeRedisClient
}

export class ZScanner extends Readable {
  public cursor: string

  public data: string[] = []

  public del: boolean

  public key: string

  public queueWriter: WrappedNodeRedisClient

  public constructor (options: Partial<ZScannerOptions>) {
    super({
      objectMode: true,
      ...options
    })

    if (options.key === undefined) {
      throw new Error('Option "key" is undefined')
    }

    if (options.queueWriter === undefined) {
      throw new Error('Option "queueWriter" is undefined')
    }

    this.cursor = options.cursor ?? '0'
    this.del = options.del ?? false
    this.key = options.key
    this.queueWriter = options.queueWriter
  }

  public _destroy (error: Error, callback: (error?: Error) => void): void {
    if (this.del) {
      callback()
      return
    }

    this.queueWriter
      .del(this.key)
      .then(() => {
        callback(error)
      })
      .catch(() => {
        callback(error)
      })
  }

  public _read (size: number): void {
    if (this.data.length > 0) {
      this.push(this.data.splice(0, 2))
    } else if (this.cursor === '-1') {
      this.push(null)
    } else {
      this.readData(size)
    }
  }

  protected handleScan (size: number, cursor: string, data: string[]): void {
    this.data = data
    this.cursor = cursor === '0' ? '-1' : cursor
    this._read(size)
  }

  protected readData (size: number): void {
    this.queueWriter
      .zscan(this.key, Number(this.cursor), ['COUNT', size])
      .then((result) => {
        this.handleScan(size, ...result as [string, string[]])
      })
      .catch((error: unknown) => {
        this.destroy(new Error(`Scan error: ${String(error)}`))
      })
  }
}
