import { GenericContainer } from 'testcontainers'
import type { SinonSandbox } from 'sinon'
import type { StartedTestContainer } from 'testcontainers'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { XAdder } from '../../../../src/server/helpers/redis/xadder'
import type { XAdderOptions } from '../../../../src/server/helpers/redis/xadder'
import { createNodeRedisClient } from 'handy-redis'
import { createSandbox } from 'sinon'
import { expect } from 'chai'

describe('XAdder', () => {
  describe('should fail when', () => {
    it('store.batch fails', storeBatchFails)
    it('store.batch.exec fails', storeBatchExecFails)
    it('store.batch.exec fails on final', storeBatchExecFailsOnFinal)
    it('store.batch.xadd fails', storeBatchXAddFails)
  })

  describe('should', () => {
    it('write items', writeItems)
    it('write items on final', writeItemsOnFinal)
  })
})

class Helpers {
  public container: StartedTestContainer
  public sandbox: SinonSandbox
  public store: WrappedNodeRedisClient
}

const PORT = 6379
const helpers = new Helpers()

beforeAll(async () => {
  helpers.container = await new GenericContainer('redis')
    .withExposedPorts(PORT)
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

function createAdder (options: Partial<XAdderOptions>): XAdder {
  return new XAdder({
    maxLength: 1024,
    store: helpers.store,
    ...options
  })
}

function storeBatchFails (finish: (error?: unknown) => void): void {
  const adder = createAdder({
    highWaterMark: 1
  })

  helpers.sandbox
    .stub(helpers.store, 'batch')
    .throws(new Error('batch fail'))

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

function storeBatchExecFails (finish: (error?: unknown) => void): void {
  const adder = createAdder({
    highWaterMark: 1
  })

  const batch = helpers.store.batch()

  helpers.sandbox
    .stub(batch, 'exec')
    .rejects(new Error('exec fail'))

  helpers.sandbox
    .stub(helpers.store, 'batch')
    .returns(batch)

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

function storeBatchExecFailsOnFinal (finish: (error?: unknown) => void): void {
  const adder = createAdder({
    highWaterMark: 2
  })

  const batch = helpers.store.batch()

  helpers.sandbox
    .stub(batch, 'exec')
    .rejects(new Error('exec fail'))

  helpers.sandbox
    .stub(helpers.store, 'batch')
    .returns(batch)

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

function storeBatchXAddFails (finish: (error?: unknown) => void): void {
  const adder = createAdder({
    highWaterMark: 1
  })

  const batch = helpers.store.batch()

  helpers.sandbox
    .stub(batch, 'xadd')
    .throws(new Error('xadd fail'))

  helpers.sandbox
    .stub(helpers.store, 'batch')
    .returns(batch)

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

function writeItems (finish: (error?: unknown) => void): void {
  const adder = createAdder({
    highWaterMark: 2
  })

  adder.on('close', () => {
    helpers.store
      .xrange('key', '-', '+')
      .then((data) => {
        expect(data.length).equal(2)
        finish()
      })
      .catch((error) => {
        finish(error)
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

function writeItemsOnFinal (finish: (error?: unknown) => void): void {
  const adder = createAdder({
    highWaterMark: 2
  })

  adder.on('close', () => {
    helpers.store
      .xrange('key', '-', '+')
      .then((data) => {
        expect(data.length).equal(1)
        finish()
      })
      .catch((error) => {
        finish(error)
      })
  })

  adder.end({
    name: 'key',
    value: ['id', 'value-1']
  })
}
