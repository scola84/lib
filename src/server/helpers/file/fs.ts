import { createReadStream, createWriteStream, mkdirSync, unlink } from 'fs-extra'
import type { FileBucket } from './bucket'
import type { Readable } from 'stream'
import { isNil } from '../../../common'

export interface FsFileBucketOptions {
  dir: string
}

export class FsFileBucket implements FileBucket {
  public dir: string

  public constructor (options: FsFileBucketOptions) {
    this.dir = options.dir

    mkdirSync(this.dir, {
      recursive: true
    })
  }

  public async delete (id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      unlink(`${this.dir}/${id}`, (error) => {
        if (isNil(error)) {
          resolve()
        } else {
          reject(error)
        }
      })
    })
  }

  public async get (id: string): Promise<Readable | undefined> {
    try {
      return await Promise.resolve(createReadStream(`${this.dir}/${id}`))
    } catch (error: unknown) {
      return undefined
    }
  }

  public async put (id: string, stream: Readable): Promise<void> {
    return new Promise((resolve, reject) => {
      const writer = createWriteStream(`${this.dir}/${id}`)

      writer.once('error', reject)
      writer.once('finish', resolve)
      stream.pipe(writer)
    })
  }
}
