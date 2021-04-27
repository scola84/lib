import { Readable, Transform, Writable } from 'stream'
import { expect } from 'chai'
import { pipeline } from '../../../../src/server/helpers/stream/pipeline'

describe('pipeline', () => {
  describe('should fail when', () => {
    it('< 2 streams are provided', lessThanTwoStreamsAreProvided)
    it('streams are provided in a wrong order', streamsAreProvidedInAWrongOrder)
    it('a readable fails', aReadableFails)
    it('a transform fails', aTransformFails)
    it('a writable fails', aWritableFails)
  })

  describe('should', () => {
    it('stream', streamData)
  })
})

async function aReadableFails (): Promise<void> {
  const readable = new Readable({
    read () {
      this.destroy(new Error('Readable error'))
    }
  })

  const transform = new Transform({
    transform (chunk, encoding, callback) {
      callback(null, chunk)
    }
  })

  const writable = new Writable({
    write (chunk, encoding, callback: (error?: Error) => void) {
      callback()
    }
  })

  try {
    await pipeline(readable, transform, writable)
  } catch (error: unknown) {
    expect(readable.listeners('data').length).equal(0)
    expect(readable.listeners('error').length).equal(0)
    expect(transform.listeners('data').length).equal(0)
    expect(transform.listeners('error').length).equal(0)
    expect(writable.listeners('data').length).equal(0)
    expect(writable.listeners('error').length).equal(0)
    expect(String(error)).match(/Readable error/u)
  }
}

async function aTransformFails (): Promise<void> {
  const readable = new Readable({
    read () {
      this.push('string')
      this.push(null)
    }
  })

  const transform = new Transform({
    transform (chunk, encoding, callback: (error?: Error) => void) {
      callback(new Error('Transform error'))
    }
  })

  const writable = new Writable({
    write (chunk, encoding, callback: (error?: Error) => void) {
      callback()
    }
  })

  try {
    await pipeline(readable, transform, writable)
  } catch (error: unknown) {
    expect(readable.listeners('data').length).equal(0)
    expect(readable.listeners('error').length).equal(0)
    expect(transform.listeners('data').length).equal(0)
    expect(transform.listeners('error').length).equal(0)
    expect(writable.listeners('data').length).equal(0)
    expect(writable.listeners('error').length).equal(0)
    expect(String(error)).match(/Transform error/u)
  }
}

async function aWritableFails (): Promise<void> {
  const readable = new Readable({
    read () {
      this.push('string')
      this.push(null)
    }
  })

  const transform = new Transform({
    transform (chunk, encoding, callback) {
      callback(null, chunk)
    }
  })

  const writable = new Writable({
    write (chunk, encoding, callback: (error?: Error) => void) {
      callback(new Error('Writable error'))
    }
  })

  try {
    await pipeline(readable, transform, writable)
  } catch (error: unknown) {
    expect(readable.listeners('data').length).equal(0)
    expect(readable.listeners('error').length).equal(0)
    expect(transform.listeners('data').length).equal(0)
    expect(transform.listeners('error').length).equal(0)
    expect(writable.listeners('data').length).equal(0)
    expect(writable.listeners('error').length).equal(0)
    expect(String(error)).match(/Writable error/u)
  }
}

async function lessThanTwoStreamsAreProvided (): Promise<void> {
  try {
    await pipeline()
  } catch (error: unknown) {
    expect(String(error)).match(/Less than 2 streams provided/u)
  }
}

async function streamData (): Promise<void> {
  const chunks: string[] = []

  const readable = new Readable({
    read () {
      this.push('string')
      this.push(null)
    }
  })

  const transform = new Transform({
    transform (chunk, encoding, callback) {
      callback(null, chunk)
    }
  })

  const writable = new Writable({
    write (chunk: Buffer, encoding: string, callback: () => void) {
      chunks.push(String(chunk))
      callback()
    }
  })

  await pipeline(readable, transform, writable)
  expect(readable.listeners('data').length).equal(0)
  expect(readable.listeners('error').length).equal(0)
  expect(transform.listeners('data').length).equal(0)
  expect(transform.listeners('error').length).equal(0)
  expect(writable.listeners('data').length).equal(0)
  expect(writable.listeners('error').length).equal(0)
  expect(chunks).members(['string'])
}

async function streamsAreProvidedInAWrongOrder (): Promise<void> {
  const readable = new Readable({
    read () {
      this.push(null)
    }
  })

  const transform = new Transform({
    transform (chunk, encoding, callback) {
      callback(null, chunk)
    }
  })

  const writable = new Writable({
    write (chunk, encoding, callback: (error?: Error) => void) {
      callback()
    }
  })

  try {
    await pipeline(writable, readable, transform)
  } catch (error: unknown) {
    expect(readable.listeners('data').length).equal(0)
    expect(readable.listeners('error').length).equal(0)
    expect(transform.listeners('data').length).equal(0)
    expect(transform.listeners('error').length).equal(0)
    expect(writable.listeners('data').length).equal(0)
    expect(writable.listeners('error').length).equal(0)
    expect(String(error)).match(/Cannot pipe a Writable/u)
  }
}
