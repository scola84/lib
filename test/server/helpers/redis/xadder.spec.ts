import { GenericContainer } from 'testcontainers'
import type { StartedTestContainer } from 'testcontainers'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { XAdder } from '../../../../src/server/helpers/redis/xadder'
import type { XAdderOptions } from '../../../../src/server/helpers/redis/xadder'
import { createNodeRedisClient } from 'handy-redis'
import { expect } from 'chai'
import { stub } from 'sinon'

describe('XAdder', () => {
  describe('should emit an error when', () => {
    it('store.batch fails', storeBatchFails)
    it('store.batch.exec fails', storeBatchExecFails)
    it('store.batch.exec fails on final', storeBatchExecFailsOnFinal)
    it('store.batch.xadd fails', storeBatchXAddFails)
  })

  describe('should successfully', () => {
    it('write items', writeItems)
    it('write items on final', writeItemsOnFinal)
  })
})

async function createContainer (): Promise<StartedTestContainer> {
  return new GenericContainer('redis')
    .withExposedPorts(6379)
    .start()
}

function createAdder (store: WrappedNodeRedisClient, options: Partial<XAdderOptions> = {}): XAdder {
  return new XAdder({
    maxLength: 1024,
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

async function storeBatchFails (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const adder = createAdder(store, {
    highWaterMark: 1
  })

  stub(store, 'batch').throws(new Error('batch fail'))

  adder.on('close', () => {
    store.end()
    container.stop().catch(() => {})
  })

  adder.on('error', (error) => {
    try {
      expect(String(error)).equal('Error: batch fail')
      finish()
    } catch (tryError: unknown) {
      finish(tryError)
    }
  })

  adder.write({})
  adder.write({})
  adder.end()
}

async function storeBatchExecFails (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const adder = createAdder(store, {
    highWaterMark: 1
  })

  const batch = store.batch()

  stub(batch, 'exec').rejects(new Error('exec fail'))
  stub(store, 'batch').returns(batch)

  adder.on('close', () => {
    store.end()
    container.stop().catch(() => {})
  })

  adder.on('error', (error) => {
    try {
      expect(String(error)).equal('Error: exec fail')
      finish()
    } catch (tryError: unknown) {
      finish(tryError)
    }
  })

  adder.write({})
  adder.write({})
  adder.end()
}

async function storeBatchExecFailsOnFinal (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const adder = createAdder(store, {
    highWaterMark: 2
  })

  const batch = store.batch()

  stub(batch, 'exec').rejects(new Error('exec fail'))
  stub(store, 'batch').returns(batch)

  adder.on('close', () => {
    store.end()
    container.stop().catch(() => {})
  })

  adder.on('error', (error) => {
    try {
      expect(String(error)).equal('Error: exec fail')
      finish()
    } catch (tryError: unknown) {
      finish(tryError)
    }
  })

  adder.write({})
  adder.write({})
  adder.end({})
}

async function storeBatchXAddFails (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const adder = createAdder(store, {
    highWaterMark: 1
  })

  const batch = store.batch()

  stub(batch, 'xadd').throws(new Error('xadd fail'))
  stub(store, 'batch').returns(batch)

  adder.on('close', () => {
    store.end()
    container.stop().catch(() => {})
  })

  adder.on('error', (error) => {
    try {
      expect(String(error)).equal('Error: xadd fail')
      finish()
    } catch (tryError: unknown) {
      finish(tryError)
    }
  })

  adder.write({})
  adder.write({})
  adder.end()
}

async function writeItems (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const adder = createAdder(store, {
    highWaterMark: 2
  })

  adder.on('close', () => {
    store
      .xrange('key', '-', '+')
      .then((data) => {
        expect(data.length).equal(2)
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

  adder.write({
    name: 'key',
    value: ['id', 'value-1']
  })

  adder.write({
    name: 'key',
    value: ['id', 'value-1']
  })

  adder.end()
}

async function writeItemsOnFinal (finish: (error?: unknown) => void): Promise<void> {
  const container = await createContainer()
  const store = createStore(container)

  const adder = createAdder(store, {
    highWaterMark: 2
  })

  adder.on('close', () => {
    store
      .xrange('key', '-', '+')
      .then((data) => {
        expect(data.length).equal(1)
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

  adder.end({
    name: 'key',
    value: ['id', 'value-1']
  })
}
