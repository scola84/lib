import { createReadStream, createWriteStream } from 'fs-extra'
import type { Bucket } from './bucket'

export interface FsBucketOptions {
  dir: string
}

export class FsBucket implements Bucket {
  public dir: string

  public constructor (options: FsBucketOptions) {
    this.dir = options.dir
  }

  public async get (id: string): Promise<NodeJS.ReadableStream> {
    return Promise.resolve(createReadStream(`${this.dir}/${id}`))
  }

  public async put (id: string, stream: NodeJS.ReadableStream): Promise<void> {
    return new Promise((resolve, reject) => {
      const writer = createWriteStream(`${this.dir}/${id}`)

      writer.once('error', reject)
      writer.once('finish', resolve)
      stream.pipe(writer)
    })
  }
}
