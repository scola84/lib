import type { FileBucket } from './bucket'
import type { Readable } from 'stream'
import type { S3 } from '@aws-sdk/client-s3'

export interface S3FileBucketOptions {
  acl?: string
  name: string
  s3: S3
}

export class S3Bucket implements FileBucket {
  public acl: string

  public name: string

  public s3: S3

  public constructor (options: S3FileBucketOptions) {
    this.acl = options.acl ?? 'private'
    this.name = options.name
    this.s3 = options.s3
  }

  public async delete (id: string): Promise<unknown> {
    return this.s3.deleteObject({
      Bucket: this.name,
      Key: id
    })
  }

  public async get (id: string): Promise<Readable | undefined> {
    const object = await this.s3.getObject({
      Bucket: this.name,
      Key: id
    })

    return object.Body as Readable
  }

  public async put (id: string, stream: Readable): Promise<unknown> {
    return this.s3.putObject({
      ACL: this.acl,
      Body: stream,
      Bucket: this.name,
      Key: id
    })
  }
}
