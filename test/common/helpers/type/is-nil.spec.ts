import { expect } from 'chai'
import { isNil } from '../../../../src'

describe('isNil', () => {
  it('should return false for non-nils', returnFalseForNonNils)
  it('should return true for nils', returnTrueForNils)
})

class Foo {
  public bar: string
}

function returnFalseForNonNils (): void {
  expect(isNil(BigInt(0))).equal(false)
  expect(isNil(true)).equal(false)
  expect(isNil(0)).equal(false)
  expect(isNil('')).equal(false)
  expect(isNil(Symbol(''))).equal(false)
  expect(isNil([1, 2, 3])).equal(false)
  expect(isNil({})).equal(false)
  expect(isNil({ 'constructor': {} })).equal(false)
  expect(isNil({ 'foo': 'bar' })).equal(false)
  expect(isNil(Object.create(null))).equal(false)
  expect(isNil(Object.prototype)).equal(false)
  expect(isNil(() => {})).equal(false)
  expect(isNil(Math)).equal(false)
  expect(isNil(new Foo())).equal(false)
}

function returnTrueForNils (): void {
  expect(isNil(undefined)).equal(true)
  expect(isNil(null)).equal(true)
}
