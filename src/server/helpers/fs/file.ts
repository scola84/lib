import fs from 'fs-extra'

export class File {
  public content: Buffer | string

  public fs = fs

  public source: string

  public constructor (source: string) {
    this.source = source
  }

  public async read (): Promise<this> {
    this.content = await this.fs.readFile(this.source)
    return this
  }

  public replace (search: RegExp | string, replace: string): this {
    this.content = String(this.content).replace(search, replace)
    return this
  }

  public async unlink (): Promise<this> {
    await this.fs.unlink(this.source)
    return this
  }

  public async write (): Promise<this> {
    await this.fs.writeFile(this.source, this.content)
    return this
  }
}
