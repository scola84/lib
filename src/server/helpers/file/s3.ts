import type { Bucket } from './bucket'
import type { S3 } from '@aws-sdk/client-s3'

export interface S3BucketOptions {
  acl?: string
  name: string
  s3: S3
}

export class S3Bucket implements Bucket {
  public acl: string

  public name: string

  public s3: S3

  public constructor (options: S3BucketOptions) {
    this.acl = options.acl ?? 'private'
    this.name = options.name
    this.s3 = options.s3
  }

  public async get (id: string): Promise<NodeJS.ReadableStream> {
    return (await this.s3.getObject({
      Bucket: this.name,
      Key: id
    })).Body
  }

  public async put (id: string, stream: NodeJS.ReadableStream): Promise<unknown> {
    return this.s3.putObject({
      ACL: this.acl,
      Body: stream,
      Bucket: this.name,
      Key: id
    })
  }
}
