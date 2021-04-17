import { GenericContainer } from 'testcontainers'
import type { StartedTestContainer } from 'testcontainers'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { ZScanner } from '../../../../src/server/helpers/redis/zscanner'
import type { ZScannerOptions } from '../../../../src/server/helpers/redis/zscanner'
import { createNodeRedisClient } from 'handy-redis'
import { expect } from 'chai'
import { stub } from 'sinon'

describe('ZScanner', () => {
  describe('should emit an error when', () => {
    it('store.del fails', storeDelFails)
    it('store.zscan fails', storeZscanFails)
  })

  describe('should successfully', () => {
    it('delete the set', deleteTheSet)
    it('emit members', emitMembers)
    it('use the cursor', useTheCursor)
  })
})

async function createContainer (): Promise<StartedTestContainer> {
  return new GenericContainer('redis')
    .withExposedPorts(6379)
    .start()
}

function createScanner (store: WrappedNodeRedisClient, options: Partial<ZScannerOptions> = {}): ZScanner {
  return new ZScanner({
    key: 'key',
    store,
    ...options
  })
}

function createStore (container: StartedTestContainer): WrappedNodeRedisClient {
  return createNodeRedisClient(
    container.getMappedPort(6379),
    container.getHost()
  )
}

async function deleteTheSet (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const scanner = createScanner(store, {
    delete: true
  })

  await store.zadd('key', [0, 'member-0'])

  scanner.on('close', () => {
    store
      .exists('key')
      .then((exists) => {
        expect(exists).equal(0)
        finish()
      })
      .catch((error) => {
        finish(error)
      })
      .finally(() => {
        store.end()
        container.stop().catch(() => {})
      })
  })

  scanner.on('data', () => {})
}

async function emitMembers (finish: (error?: unknown) => void): Promise<void> {
  const size = 2
  const members = new Array(size).fill(0)
  const data: Array<[number, string]> = []

  const expectedData = [
    ['member-0', '0'],
    ['member-1', '1']
  ]

  const container = await createContainer()
  const store = createStore(container)
  const scanner = createScanner(store)

  await Promise.all(members.map(async (value, index) => {
    return store.zadd('key', [index, `member-${index}`])
  }))

  scanner.on('close', () => {
    try {
      expect(data).deep.members(expectedData)
      expect(scanner.cursor).equal(0)
      finish()
    } catch (error: unknown) {
      finish(error)
    } finally {
      store.end()
      container.stop().catch(() => {})
    }
  })

  scanner.on('data', (datum: [number, string]) => {
    data.push(datum)
  })
}

async function storeDelFails (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const scanner = createScanner(store, {
    delete: true
  })

  stub(store, 'del').rejects(new Error('del fail'))

  scanner.on('close', () => {
    store.end()
    container.stop().catch(() => {})
  })

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

async function storeZscanFails (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const scanner = createScanner(store, {
    delete: true
  })

  stub(store, 'zscan').rejects(new Error('zscan fail'))

  scanner.on('close', () => {
    store.end()
    container.stop().catch(() => {})
  })

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

async function useTheCursor (finish: (error?: unknown) => void): Promise<void> {
  const size = 256
  const members = new Array(size).fill(0)
  const data: Array<[number, string]> = []

  const container = await createContainer()
  const store = createStore(container)
  const scanner = createScanner(store)

  await Promise.all(members.map(async (value, index) => {
    return store.zadd('key', [index, `member-${index}`])
  }))

  scanner.on('close', () => {
    try {
      expect(data.length).equal(size)
      expect(scanner.cursor).equal(0)
      finish()
    } catch (error: unknown) {
      finish(error)
    } finally {
      store.end()
      container.stop().catch(() => {})
    }
  })

  scanner.on('data', (datum: [number, string]) => {
    data.push(datum)

    if (data.length === 0) {
      expect(scanner.cursor).not.equal(0)
    }
  })
}
