import { Readable } from 'stream'
import type { ReadableOptions } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'

export interface ZScannerOptions extends ReadableOptions {
  cursor: string
  del: boolean
  key: string
  queue: WrappedNodeRedisClient
}

export class ZScanner extends Readable {
  public cursor: string

  public data: string[] = []

  public del: boolean

  public key: string

  public queue: WrappedNodeRedisClient

  public constructor (options: Partial<ZScannerOptions>) {
    super({
      objectMode: true,
      ...options
    })

    const {
      cursor = '0',
      del = false,
      key,
      queue
    } = options

    if (key === undefined) {
      throw new Error('Key is undefined')
    }

    if (queue === undefined) {
      throw new Error('Queue is undefined')
    }

    this.cursor = cursor
    this.del = del
    this.key = key
    this.queue = queue
  }

  public _destroy (error: Error, callback: (error?: Error) => void): void {
    if (this.del) {
      callback()
      return
    }

    this.queue
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
    this.queue
      .zscan(this.key, Number(this.cursor), ['COUNT', size])
      .then((result) => {
        this.handleScan(size, ...result as [string, string[]])
      })
      .catch((error: unknown) => {
        this.destroy(new Error(`Scan error: ${String(error)}`))
      })
  }
}
