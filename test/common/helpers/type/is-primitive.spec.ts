import { expect } from 'chai'
import { isPrimitive } from '../../../../src/common/helpers/is-primitive'

describe('isPrimitive', () => {
  it('should return false for non-primitives', returnFalseForNonPrimitives)
  it('should return true for primitives', returnTrueForPrimitives)
})

class Foo {
  public bar: string
}

function returnFalseForNonPrimitives (): void {
  expect(isPrimitive(undefined)).eq(false)
  expect(isPrimitive(null)).eq(false)
  expect(isPrimitive([1, 2, 3])).eq(false)
  expect(isPrimitive({})).eq(false)
  expect(isPrimitive({ 'constructor': {} })).eq(false)
  expect(isPrimitive({ 'foo': 'bar' })).eq(false)
  expect(isPrimitive(Object.create(null))).eq(false)
  expect(isPrimitive(Object.prototype)).eq(false)
  expect(isPrimitive(() => {})).eq(false)
  expect(isPrimitive(Math)).eq(false)
  expect(isPrimitive(new Foo())).eq(false)
}

function returnTrueForPrimitives (): void {
  expect(isPrimitive(BigInt(0))).eq(true)
  expect(isPrimitive(true)).eq(true)
  expect(isPrimitive(0)).eq(true)
  expect(isPrimitive('')).eq(true)
  expect(isPrimitive(Symbol(''))).eq(true)
}
