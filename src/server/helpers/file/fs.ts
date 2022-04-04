import { createReadStream, createWriteStream, mkdirSync, unlink } from 'fs-extra'
import type { FileBucket } from './bucket'
import type { Readable } from 'stream'
import type { ScolaFile } from '../../../common'
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

  public async delete (file: ScolaFile): Promise<void> {
    return new Promise((resolve, reject) => {
      unlink(`${this.dir}/${file.id}`, (error) => {
        if (isNil(error)) {
          resolve()
        } else {
          reject(error)
        }
      })
    })
  }

  public async get (file: ScolaFile): Promise<Readable | undefined> {
    return Promise.resolve(createReadStream(`${this.dir}/${file.id}`))
  }

  public async put (file: ScolaFile, readable: Readable): Promise<void> {
    return new Promise((resolve, reject) => {
      const writable = createWriteStream(`${this.dir}/${file.id}`)

      readable.once('error', reject)
      writable.once('error', reject)
      writable.once('finish', resolve)
      readable.pipe(writable)
    })
  }
}
