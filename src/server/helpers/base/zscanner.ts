import { Readable } from 'stream'
import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'

export interface ZScannerOptions {
  client: RedisOptions
  count: number
  cursor: string
  del: boolean
  key: string
}

export class ZScanner extends Readable {
  public client: Redis.Redis

  public count: number

  public cursor: string

  public data: string[] = []

  public del: boolean

  public key: string

  public constructor (options: Partial<ZScannerOptions>) {
    super({
      objectMode: true
    })

    const {
      client,
      count,
      cursor,
      del,
      key
    } = options

    if (client === undefined) {
      throw new Error('Client is undefined')
    }

    if (key === undefined) {
      throw new Error('Key is undefined')
    }

    this.client = new Redis(client)
    this.count = count ?? 1000
    this.cursor = cursor ?? '0'
    this.del = del ?? false
    this.key = key
  }

  public _destroy (): void {
    if (this.del) {
      this.client
        .del(this.key)
        .catch((error) => {
          this.emit('error', new Error(`Del error: ${String(error)}`))
        })
    }
  }

  public _read (): void {
    if (this.data.length > 0) {
      this.push(this.data.splice(0, 2))
    } else if (this.cursor === '-1') {
      this.push(null)
    } else {
      this.readData()
    }
  }

  protected handleScan (cursor: string, data: string[]): void {
    this.data = data

    if (this.data.length > 0) {
      this.cursor = cursor === '0'
        ? '-1'
        : cursor
      this.push(this.data.splice(0, 2))
    } else {
      this.push(null)
    }
  }

  protected readData (): void {
    this.client
      .zscan(this.key, this.cursor, 'COUNT', this.count)
      .then(([cursor, data]) => {
        this.handleScan(cursor, data)
      })
      .catch((error) => {
        this.emit('error', new Error(`Scan error: ${String(error)}`))
      })
  }
}
