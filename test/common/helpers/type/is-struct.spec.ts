import { expect } from 'chai'
import { isStruct } from '../../../../src'

describe('isStruct', () => {
  it('should return false for non-objects', returnFalseForNonStructs)
  it('should return true for objects', returnTrueForStructs)
})

class Foo {
  public bar: string
}

function returnFalseForNonStructs (): void {
  expect(isStruct(undefined)).equal(false)
  expect(isStruct(null)).equal(false)
  expect(isStruct(BigInt(0))).equal(false)
  expect(isStruct(true)).equal(false)
  expect(isStruct(0)).equal(false)
  expect(isStruct('')).equal(false)
  expect(isStruct(Symbol(''))).equal(false)
  expect(isStruct([1, 2, 3])).equal(false)
  expect(isStruct(() => {})).equal(false)
  expect(isStruct(Math)).equal(false)
  expect(isStruct(new Foo())).equal(false)
}

function returnTrueForStructs (): void {
  expect(isStruct({})).equal(true)
  expect(isStruct({ 'constructor': {} })).equal(true)
  expect(isStruct({ 'foo': 'bar' })).equal(true)
  expect(isStruct(Object.create(null))).equal(true)
  expect(isStruct(Object.prototype)).equal(true)
}
