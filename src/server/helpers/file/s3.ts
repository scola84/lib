import type { FileBucket } from './bucket'
import type { Readable } from 'stream'
import { S3 } from '@aws-sdk/client-s3'
import type { S3ClientConfig } from '@aws-sdk/client-s3'
import type { ScolaFile } from '../../../common'

export interface S3FileBucketOptions {
  acl?: string
  name: string
  s3: S3ClientConfig
}

export class S3FileBucket implements FileBucket {
  public acl: string

  public client: S3

  public name: string

  public constructor (options: S3FileBucketOptions) {
    this.acl = options.acl ?? 'private'
    this.client = new S3(options.s3)
    this.name = options.name
  }

  public async delete (file: ScolaFile): Promise<unknown> {
    return this.client.deleteObject({
      Bucket: this.name,
      Key: file.id
    })
  }

  public async get (file: ScolaFile): Promise<Readable | undefined> {
    const object = await this.client.getObject({
      Bucket: this.name,
      Key: file.id
    })

    return object.Body as Readable
  }

  public async put (file: ScolaFile, stream: Readable): Promise<unknown> {
    return this.client.putObject({
      ACL: this.acl,
      Body: stream,
      Bucket: this.name,
      ContentType: file.type,
      Key: file.id
    })
  }
}
