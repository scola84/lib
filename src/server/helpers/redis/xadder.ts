import type { WrappedNodeRedisClient } from 'handy-redis'
import type { WrappedNodeRedisMulti } from 'handy-redis/dist/node_redis/multi'
import { Writable } from 'stream'
import type { WritableOptions } from 'stream'

export interface XAdderItem {
  name: string
  value: [string, string]
}

export interface XAdderOptions extends WritableOptions {
  maxLength: number
  store: WrappedNodeRedisClient
}

export class XAdder extends Writable {
  public batch: WrappedNodeRedisMulti

  public count = 0

  public maxLength: number

  public store: WrappedNodeRedisClient

  public constructor (options: XAdderOptions) {
    super({
      objectMode: true,
      ...options
    })

    this.maxLength = options.maxLength
    this.store = options.store
    this.batch = this.store.batch()
  }

  public async _final (finish: (error?: Error) => void): Promise<void> {
    try {
      if (this.count > 0) {
        await this.exec()
        finish()
      } else {
        finish()
      }
    } catch (error: unknown) {
      finish(error as Error)
    }
  }

  public async _write (item: XAdderItem, encoding: string, finish: (error?: Error) => void): Promise<void> {
    try {
      this.add(item)

      if (this.count === this.writableHighWaterMark) {
        await this.exec()
        finish()
      } else {
        finish()
      }
    } catch (error: unknown) {
      finish(error as Error)
    }
  }

  protected add (item: XAdderItem): void {
    this.batch.xadd(
      item.name,
      ['MAXLEN', ['~', this.maxLength]],
      '*',
      item.value
    )

    this.count += 1
  }

  protected async exec (): Promise<[]> {
    const { batch } = this
    this.batch = this.store.batch()
    this.count = 0

    return batch.exec()
  }
}
