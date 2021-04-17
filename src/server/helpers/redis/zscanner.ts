import { Readable } from 'stream'
import type { ReadableOptions } from 'stream'
import type { WrappedNodeRedisClient } from 'handy-redis'

export interface ZScannerOptions extends ReadableOptions {
  delete?: boolean
  key: string
  store: WrappedNodeRedisClient
}

export class ZScanner extends Readable {
  public cursor = 0

  public delete: boolean

  public key: string

  public store: WrappedNodeRedisClient

  public constructor (options: ZScannerOptions) {
    super({
      objectMode: true,
      ...options
    })

    this.delete = options.delete ?? false
    this.key = options.key
    this.store = options.store
  }

  public async _destroy (error: Error, finish: (error?: Error) => void): Promise<void> {
    try {
      if (this.delete) {
        await this.store.del(this.key)
        finish(error)
      } else {
        finish(error)
      }
    } catch (deleteError: unknown) {
      finish(deleteError as Error)
    }
  }

  public async _read (size: number): Promise<void> {
    try {
      const [cursor, data] = await this.store.zscan(
        this.key,
        Number(this.cursor),
        ['COUNT', size]
      ) as [string, string[]]

      this.cursor = Number(cursor)

      while (data.length > 0) {
        this.push(data.splice(0, 2))
      }

      if (this.cursor === 0) {
        this.push(null)
      }
    } catch (error: unknown) {
      this.destroy(error as Error)
    }
  }
}
