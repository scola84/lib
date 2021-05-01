import { File } from './file'
import { randomBytes } from 'crypto'

export class Copy extends File {
  public target: string

  public constructor (source: string, target?: string) {
    super(source)
    this.target = target ?? `/tmp/copy-${randomBytes(16).toString('hex')}`
  }

  public async unlinkTarget (): Promise<this> {
    await this.fs.unlink(this.target)
    return this
  }

  public async writeTarget (): Promise<this> {
    await this.fs.writeFile(this.target, this.content)
    return this
  }
}
