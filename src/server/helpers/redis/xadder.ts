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
  queue: WrappedNodeRedisClient
}

export class XAdder extends Writable {
  public batch: WrappedNodeRedisMulti

  public count = 0

  public maxLength: number

  public queue: WrappedNodeRedisClient

  public constructor (options: Partial<XAdderOptions>) {
    super({
      objectMode: true,
      ...options
    })

    const {
      maxLength = 1024 * 1024,
      queue
    } = options

    if (queue === undefined) {
      throw new Error('Queue is undefined')
    }

    this.maxLength = maxLength
    this.queue = queue
    this.batch = this.queue.batch()
  }

  public _final (callback: (error?: Error) => void): void {
    if (this.count > 0) {
      this.exec(callback, false)
    } else {
      callback()
    }
  }

  public _write (item: XAdderItem, encoding: string, callback: (error?: Error) => void): void {
    this.batch.xadd(
      item.name,
      ['MAXLEN', ['~', this.maxLength]],
      '*',
      item.value
    )

    this.count += 1

    if (this.count === this.writableHighWaterMark) {
      this.exec(callback)
    } else {
      callback()
    }
  }

  protected exec (callback: (error?: Error) => void, restart = true): void {
    const { batch } = this

    if (restart) {
      this.batch = this.queue.batch()
      this.count = 0
    }

    batch
      .exec()
      .then(() => {
        callback()
      })
      .catch((error: unknown) => {
        callback(new Error(`Add error: ${String(error)}`))
      })
  }
}
