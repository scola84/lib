import type { SinonSandbox } from 'sinon'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { ZScanner } from '../../../../src/server/helpers/redis/zscanner'
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
  public sandbox: SinonSandbox
  public store: WrappedNodeRedisClient
}

const helpers = new Helpers()

beforeAll(() => {
  helpers.store = createNodeRedisClient({
    auth_pass: 'root',
    host: 'redis'
  })
})

beforeEach(() => {
  helpers.sandbox = createSandbox()
})

afterEach(async () => {
  helpers.sandbox.restore()
  await helpers.store.flushall()
})

afterAll(() => {
  helpers.store.end()
})

async function deleteTheSet (): Promise<void> {
  const key = 'zscanner-delete-the-set'

  const scanner = new ZScanner({
    delete: true,
    key,
    store: helpers.store
  })

  await helpers.store.zadd(key, [0, 'member-0'])

  return new Promise((resolve, reject) => {
    scanner.on('close', () => {
      helpers.store
        .exists('zscanner-delete-the-set')
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
  const data: Array<[number, string]> = []
  const key = 'zscanner-emit-members'
  const members = new Array(2).fill(0)

  const expectedData = [
    ['member-0', '0'],
    ['member-1', '1']
  ]

  const scanner = new ZScanner({
    key,
    store: helpers.store
  })

  await Promise.all(members.map(async (value, index) => {
    return helpers.store.zadd(key, [index, `member-${index}`])
  }))

  return new Promise((resolve, reject) => {
    scanner.on('close', () => {
      try {
        expect(data).deep.members(expectedData)
        expect(data.length).equal(members.length)
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
  const key = 'zscanner-store-del-fails'

  const scanner = new ZScanner({
    delete: true,
    key,
    store: helpers.store
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
  const key = 'zscanner-store-zscan-fails'

  const scanner = new ZScanner({
    delete: true,
    key,
    store: helpers.store
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
  const data: Array<[number, string]> = []
  const key = 'zscanner-use-the-cursor'
  const members = new Array(256).fill(0)

  const scanner = new ZScanner({
    key,
    store: helpers.store
  })

  await Promise.all(members.map(async (value, index) => {
    return helpers.store.zadd(key, [index, `member-${index}`])
  }))

  return new Promise((resolve, reject) => {
    scanner.on('close', () => {
      try {
        expect(data.length).equal(members.length)
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
