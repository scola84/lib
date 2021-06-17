import type { SinonSandbox } from 'sinon'
import type { WrappedNodeRedisClient } from 'handy-redis'
import { XAdder } from '../../../../src/server/helpers/redis/xadder'
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
  public sandbox: SinonSandbox
  public store: WrappedNodeRedisClient
}

const helpers = new Helpers()

beforeAll(() => {
  helpers.store = createNodeRedisClient({
    auth_pass: 'root'
  })
})

beforeEach(() => {
  helpers.sandbox = createSandbox()
})

afterEach(() => {
  helpers.sandbox.restore()
})

afterAll(async () => {
  await helpers.store.flushall()
  helpers.store.end()
})

function storeBatchFails (finish: jest.DoneCallback): void {
  const adder = new XAdder({
    highWaterMark: 1,
    maxLength: 1024,
    store: helpers.store
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

function storeBatchExecFails (finish: jest.DoneCallback): void {
  const adder = new XAdder({
    highWaterMark: 1,
    maxLength: 1024,
    store: helpers.store
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

function storeBatchExecFailsOnFinal (finish: jest.DoneCallback): void {
  const adder = new XAdder({
    highWaterMark: 2,
    maxLength: 1024,
    store: helpers.store
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

function storeBatchXAddFails (finish: jest.DoneCallback): void {
  const adder = new XAdder({
    highWaterMark: 1,
    maxLength: 1024,
    store: helpers.store
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

function writeItems (finish: jest.DoneCallback): void {
  const key = 'xadder-write-items'

  const adder = new XAdder({
    highWaterMark: 2,
    maxLength: 1024,
    store: helpers.store
  })

  adder.on('close', () => {
    helpers.store
      .xrange(key, '-', '+')
      .then((data) => {
        expect(data.length).equal(2)
        finish()
      })
      .catch((error) => {
        finish(error)
      })
  })

  adder.write({
    name: key,
    value: ['id', 'value-1']
  })

  adder.write({
    name: key,
    value: ['id', 'value-1']
  })

  adder.end()
}

function writeItemsOnFinal (finish: jest.DoneCallback): void {
  const key = 'xadder-write-items-on-final'

  const adder = new XAdder({
    highWaterMark: 2,
    maxLength: 1024,
    store: helpers.store
  })

  adder.on('close', () => {
    helpers.store
      .xrange(key, '-', '+')
      .then((data) => {
        expect(data.length).equal(1)
        finish()
      })
      .catch((error) => {
        finish(error)
      })
  })

  adder.end({
    name: key,
    value: ['id', 'value-1']
  })
}
