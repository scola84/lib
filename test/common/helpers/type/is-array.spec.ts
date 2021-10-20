import { expect } from 'chai'
import { isArray } from '../../../../src'

describe('isArray', () => {
  it('should return false for non-arrays', returnFalseForNonArrays)
  it('should return true for arrays', returnTrueForArrays)
})

class Foo {
  public bar: string
}

function returnFalseForNonArrays (): void {
  expect(isArray(undefined)).equal(false)
  expect(isArray(null)).equal(false)
  expect(isArray(BigInt(0))).equal(false)
  expect(isArray(true)).equal(false)
  expect(isArray(0)).equal(false)
  expect(isArray('')).equal(false)
  expect(isArray(Symbol(''))).equal(false)
  expect(isArray({})).equal(false)
  expect(isArray({ 'constructor': {} })).equal(false)
  expect(isArray({ 'foo': 'bar' })).equal(false)
  expect(isArray(Object.create(null))).equal(false)
  expect(isArray(Object.prototype)).equal(false)
  expect(isArray(() => {})).equal(false)
  expect(isArray(Math)).equal(false)
  expect(isArray(new Foo())).equal(false)
}

function returnTrueForArrays (): void {
  expect(isArray([1, 2, 3])).equal(true)
}
