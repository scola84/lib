import { File } from './file'
import randomString from 'crypto-random-string'

export class Copy extends File {
  public target: string

  public constructor (source: string, target?: string) {
    super(source)
    this.target = target ?? `/tmp/copy-${randomString(16)}`
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
