import type { File } from '../../../common'
import type { FileBucket } from './bucket'
import type { Readable } from 'stream'
import type { S3 } from '@aws-sdk/client-s3'

export interface S3FileBucketOptions {
  acl?: string
  name: string
  s3: S3
}

export class S3FileBucket implements FileBucket {
  public acl: string

  public name: string

  public s3: S3

  public constructor (options: S3FileBucketOptions) {
    this.acl = options.acl ?? 'private'
    this.name = options.name
    this.s3 = options.s3
  }

  public async delete (file: File): Promise<unknown> {
    return this.s3.deleteObject({
      Bucket: this.name,
      Key: file.id
    })
  }

  public async get (file: File): Promise<Readable | undefined> {
    const object = await this.s3.getObject({
      Bucket: this.name,
      Key: file.id
    })

    return object.Body as Readable
  }

  public async put (file: File, stream: Readable): Promise<unknown> {
    return this.s3.putObject({
      ACL: this.acl,
      Body: stream,
      Bucket: this.name,
      ContentType: file.type,
      Key: file.id
    })
  }
}
