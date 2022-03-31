import { Readable, Transform, Writable } from 'stream'
import { expect } from 'chai'
import { pipeline } from '../../../../src/server/helpers/stream/pipeline'
import { spy } from 'sinon'

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
  const closeListener = spy()

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

  readable.on('close', () => {
    closeListener()
  })

  transform.on('close', () => {
    closeListener()
  })

  writable.on('close', () => {
    closeListener()
  })

  try {
    await pipeline(readable, transform, writable)
  } catch (error: unknown) {
    for (const stream of [readable, transform, writable]) {
      expect(stream.listeners('data').length).eq(0)
      expect(stream.listeners('error').length).eq(0)
    }

    expect(closeListener.callCount).eq(3)
    expect(String(error)).match(/Readable error/u)
  }
}

async function aTransformFails (): Promise<void> {
  const closeListener = spy()

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

  readable.on('close', () => {
    closeListener()
  })

  transform.on('close', () => {
    closeListener()
  })

  writable.on('close', () => {
    closeListener()
  })

  try {
    await pipeline(readable, transform, writable)
  } catch (error: unknown) {
    for (const stream of [readable, transform, writable]) {
      expect(stream.listeners('data').length).eq(0)
      expect(stream.listeners('error').length).eq(0)
    }

    expect(closeListener.callCount).eq(3)
    expect(String(error)).match(/Transform error/u)
  }
}

async function aWritableFails (): Promise<void> {
  const closeListener = spy()

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

  readable.on('close', () => {
    closeListener()
  })

  transform.on('close', () => {
    closeListener()
  })

  writable.on('close', () => {
    closeListener()
  })

  try {
    await pipeline(readable, transform, writable)
  } catch (error: unknown) {
    for (const stream of [readable, transform, writable]) {
      expect(stream.listeners('data').length).eq(0)
      expect(stream.listeners('error').length).eq(0)
    }

    expect(closeListener.callCount).eq(3)
    expect(String(error)).match(/Writable error/u)
  }
}

async function lessThanTwoStreamsAreProvided (): Promise<void> {
  const closeListener = spy()

  const readable = new Readable({
    read () {
      this.push(null)
    }
  })

  readable.on('close', () => {
    closeListener()
  })

  try {
    await pipeline(readable)
  } catch (error: unknown) {
    await new Promise<void>((resolve) => {
      process.nextTick(() => {
        expect(readable.listeners('data').length).eq(0)
        expect(readable.listeners('error').length).eq(0)
        expect(closeListener.callCount).eq(1)
        expect(String(error)).match(/Less than 2 streams provided/u)
        resolve()
      })
    })
  }
}

async function streamData (): Promise<void> {
  const chunks: string[] = []
  const closeListener = spy()

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

  readable.on('close', () => {
    closeListener()
  })

  transform.on('close', () => {
    closeListener()
  })

  await pipeline(readable, transform, writable)

  for (const stream of [readable, transform, writable]) {
    expect(stream.listeners('data').length).eq(0)
    expect(stream.listeners('error').length).eq(0)
  }

  expect(closeListener.callCount).eq(2)
  expect(chunks).members(['string'])
}

async function streamsAreProvidedInAWrongOrder (): Promise<void> {
  const closeListener = spy()

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

  readable.on('close', () => {
    closeListener()
  })

  transform.on('close', () => {
    closeListener()
  })

  writable.on('close', () => {
    closeListener()
  })

  try {
    await pipeline(writable, readable, transform)
  } catch (error: unknown) {
    await new Promise<void>((resolve) => {
      process.nextTick(() => {
        for (const stream of [readable, transform, writable]) {
          expect(stream.listeners('data').length).eq(0)
          expect(stream.listeners('error').length).eq(0)
        }

        expect(closeListener.callCount).eq(3)
        expect(String(error)).match(/Cannot pipe a Writable/u)
        resolve()
      })
    })
  }
}
