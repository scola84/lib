import type { Readable } from 'stream'

export interface FileBucket {
  delete: (id: string) => Promise<unknown>
  get: (id: string) => Promise<Readable | undefined>
  put: (id: string, stream: Readable) => Promise<unknown>
}
