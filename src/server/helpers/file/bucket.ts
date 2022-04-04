import type { Readable } from 'stream'
import type { ScolaFile } from '../../../common'

export interface FileBucket {
  delete: (file: ScolaFile) => Promise<unknown>
  get: (file: ScolaFile) => Promise<Readable | undefined>
  put: (file: ScolaFile, stream: Readable) => Promise<unknown>
}
