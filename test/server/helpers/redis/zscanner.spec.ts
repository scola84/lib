import { GenericContainer } from 'testcontainers'
import type { SinonSandbox } from 'sinon'
import type { StartedTestContainer } from 'testcontainers'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { ZScanner } from '../../../../src/server/helpers/redis/zscanner'
import type { ZScannerOptions } from '../../../../src/server/helpers/redis/zscanner'
import { createNodeRedisClient } from 'handy-redis'
import { createSandbox } from 'sinon'
import { expect } from 'chai'

describe('ZScanner', () => {
  describe('should fail when', () => {
    it('store.del fails', storeDelFails)
    it('store.zscan fails', storeZscanFails)
  })

  describe('should', () => {
    it('delete the set', deleteTheSet)
    it('emit members', emitMembers)
    it('use the cursor', useTheCursor)
  })
})

class Helpers {
  public container: StartedTestContainer
  public sandbox: SinonSandbox
  public store: WrappedNodeRedisClient
}

const port = 6379
const helpers = new Helpers()

beforeAll(async () => {
  helpers.container = await new GenericContainer('redis')
    .withExposedPorts(port)
    .start()

  helpers.store = createNodeRedisClient(
    helpers.container.getMappedPort(6379),
    helpers.container.getHost()
  )
})

afterAll(async () => {
  helpers.store.end()
  await helpers.container.stop()
})

beforeEach(async () => {
  helpers.sandbox = createSandbox()
  await helpers.store.flushall()
})

afterEach(() => {
  helpers.sandbox.restore()
})

function createScanner (options: Partial<ZScannerOptions> = {}): ZScanner {
  return new ZScanner({
    key: 'key',
    store: helpers.store,
    ...options
  })
}

async function deleteTheSet (): Promise<void> {
  const scanner = createScanner({
    delete: true
  })

  await helpers.store.zadd('key', [0, 'member-0'])

  return new Promise((resolve, reject) => {
    scanner.on('close', () => {
      helpers.store
        .exists('key')
        .then((exists) => {
          expect(exists).equal(0)
          resolve()
        })
        .catch((error) => {
          reject(error)
        })
    })

    scanner.on('data', () => {})
  })
}

async function emitMembers (): Promise<void> {
  const SIZE = 2

  const data: Array<[number, string]> = []
  const members = new Array(SIZE).fill(0)

  const expectedData = [
    ['member-0', '0'],
    ['member-1', '1']
  ]

  const scanner = createScanner()

  await Promise.all(members.map(async (value, index) => {
    return helpers.store.zadd('key', [index, `member-${index}`])
  }))

  return new Promise((resolve, reject) => {
    scanner.on('close', () => {
      try {
        expect(data).deep.members(expectedData)
        expect(data.length).equal(SIZE)
        expect(scanner.cursor).equal(0)
        resolve()
      } catch (error: unknown) {
        reject(error)
      }
    })

    scanner.on('data', (datum: [number, string]) => {
      data.push(datum)
    })
  })
}

function storeDelFails (finish: (error?: unknown) => void): void {
  const scanner = createScanner({
    delete: true
  })

  helpers.sandbox
    .stub(helpers.store, 'del')
    .rejects(new Error('del fail'))

  scanner.on('error', (error) => {
    try {
      expect(String(error)).equal('Error: del fail')
      finish()
    } catch (tryError: unknown) {
      finish(tryError)
    }
  })

  scanner.on('data', () => {})
}

function storeZscanFails (finish: (error?: unknown) => void): void {
  const scanner = createScanner({
    delete: true
  })

  helpers.sandbox
    .stub(helpers.store, 'zscan')
    .rejects(new Error('zscan fail'))

  scanner.on('error', (error) => {
    try {
      expect(String(error)).equal('Error: zscan fail')
      finish()
    } catch (tryError: unknown) {
      finish(tryError)
    }
  })

  scanner.on('data', () => {})
}

async function useTheCursor (): Promise<void> {
  const SIZE = 256

  const members = new Array(SIZE).fill(0)
  const data: Array<[number, string]> = []

  const scanner = createScanner()

  await Promise.all(members.map(async (value, index) => {
    return helpers.store.zadd('key', [index, `member-${index}`])
  }))

  return new Promise((resolve, reject) => {
    scanner.on('close', () => {
      try {
        expect(data.length).equal(SIZE)
        expect(scanner.cursor).equal(0)
        resolve()
      } catch (error: unknown) {
        reject(error)
      }
    })

    scanner.on('data', (datum: [number, string]) => {
      data.push(datum)

      if (data.length === 0) {
        expect(scanner.cursor).not.equal(0)
      }
    })
  })
}
