import type { File } from '../../../common'
import type { Readable } from 'stream'

export interface FileBucket {
  delete: (file: File) => Promise<unknown>
  get: (file: File) => Promise<Readable | undefined>
  put: (file: File, stream: Readable) => Promise<unknown>
}
