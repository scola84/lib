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
      count = 1000,
      cursor = '0',
      del = false,
      key
    } = options

    if (client === undefined) {
      throw new Error('Client is undefined')
    }

    if (key === undefined) {
      throw new Error('Key is undefined')
    }

    this.client = new Redis(client)
    this.count = count
    this.cursor = cursor
    this.del = del
    this.key = key
  }

  public async _destroy (): Promise<void> {
    if (this.del) {
      try {
        await this.client.del(this.key)
      } catch (error: unknown) {
        this.emit('error', new Error(`Del error: ${String(error)}`))
      }
    }
  }

  public async _read (): Promise<void> {
    if (this.data.length > 0) {
      this.push(this.data.splice(0, 2))
    } else if (this.cursor === '-1') {
      this.push(null)
    } else {
      await this.readData()
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

  protected async readData (): Promise<void> {
    try {
      this.handleScan(...(await this.client.zscan(this.key, this.cursor, 'COUNT', this.count)))
    } catch (error: unknown) {
      this.emit('error', new Error(`Scan error: ${String(error)}`))
    }
  }
}
