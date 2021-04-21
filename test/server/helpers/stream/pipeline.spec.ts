import { Readable, Transform, Writable } from 'stream'
import { expect } from 'chai'
import { pipeline } from '../../../../src/server/helpers/stream/pipeline'

describe('pipeline', () => {
  describe('should reject when', () => {
    it('streams are provided in a wrong order', streamsAreProvidedInAWrongOrder)
    it('a readable fails', aReadableFails)
    it('a transform fails', aTransformFails)
    it('a writable fails', aWritableFails)
  })

  describe('should resolve when', () => {
    it('streams run normally', streamsRunNormally)
  })
})

async function aReadableFails (): Promise<void> {
  const readable = new Readable({
    read () {
      this.destroy(new Error('readable error'))
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
    expect(String(error)).match(/readable error/u)
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
      callback(new Error('transform error'))
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
    expect(String(error)).match(/transform error/u)
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
      callback(new Error('writable error'))
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
    expect(String(error)).match(/writable error/u)
  }
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

async function streamsRunNormally (): Promise<void> {
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
