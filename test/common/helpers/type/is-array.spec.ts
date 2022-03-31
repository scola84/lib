import { expect } from 'chai'
import { isArray } from '../../../../src/common/helpers/is-array'

describe('isArray', () => {
  it('should return false for non-arrays', returnFalseForNonArrays)
  it('should return true for arrays', returnTrueForArrays)
})

class Foo {
  public bar: string
}

function returnFalseForNonArrays (): void {
  expect(isArray(undefined)).eq(false)
  expect(isArray(null)).eq(false)
  expect(isArray(BigInt(0))).eq(false)
  expect(isArray(true)).eq(false)
  expect(isArray(0)).eq(false)
  expect(isArray('')).eq(false)
  expect(isArray(Symbol(''))).eq(false)
  expect(isArray({})).eq(false)
  expect(isArray({ 'constructor': {} })).eq(false)
  expect(isArray({ 'foo': 'bar' })).eq(false)
  expect(isArray(Object.create(null))).eq(false)
  expect(isArray(Object.prototype)).eq(false)
  expect(isArray(() => {})).eq(false)
  expect(isArray(Math)).eq(false)
  expect(isArray(new Foo())).eq(false)
}

function returnTrueForArrays (): void {
  expect(isArray([1, 2, 3])).eq(true)
}
