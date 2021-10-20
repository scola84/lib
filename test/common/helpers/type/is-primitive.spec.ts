import { expect } from 'chai'
import { isPrimitive } from '../../../../src'

describe('isPrimitive', () => {
  it('should return false for non-primitives', returnFalseForNonPrimitives)
  it('should return true for primitives', returnTrueForPrimitives)
})

class Foo {
  public bar: string
}

function returnFalseForNonPrimitives (): void {
  expect(isPrimitive(undefined)).equal(false)
  expect(isPrimitive(null)).equal(false)
  expect(isPrimitive([1, 2, 3])).equal(false)
  expect(isPrimitive({})).equal(false)
  expect(isPrimitive({ 'constructor': {} })).equal(false)
  expect(isPrimitive({ 'foo': 'bar' })).equal(false)
  expect(isPrimitive(Object.create(null))).equal(false)
  expect(isPrimitive(Object.prototype)).equal(false)
  expect(isPrimitive(() => {})).equal(false)
  expect(isPrimitive(Math)).equal(false)
  expect(isPrimitive(new Foo())).equal(false)
}

function returnTrueForPrimitives (): void {
  expect(isPrimitive(BigInt(0))).equal(true)
  expect(isPrimitive(true)).equal(true)
  expect(isPrimitive(0)).equal(true)
  expect(isPrimitive('')).equal(true)
  expect(isPrimitive(Symbol(''))).equal(true)
}
