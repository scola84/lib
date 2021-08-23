import { expect } from 'chai'
import { isObject } from '../../../../src/common/helpers/base/is-object'

describe('isObject', () => {
  it('should return false for non-objects', returnFalseForNonObjects)
  it('should return true for objects', returnTrueForObjects)
})

class Foo {
  public bar: string
}

function returnFalseForNonObjects (): void {
  expect(isObject(undefined)).equal(false)
  expect(isObject(null)).equal(false)
  expect(isObject(BigInt(0))).equal(false)
  expect(isObject(true)).equal(false)
  expect(isObject(0)).equal(false)
  expect(isObject('')).equal(false)
  expect(isObject(Symbol(''))).equal(false)
  expect(isObject([1, 2, 3])).equal(false)
  expect(isObject(() => {})).equal(false)
  expect(isObject(Math)).equal(false)
  expect(isObject(new Foo())).equal(false)
}

function returnTrueForObjects (): void {
  expect(isObject({})).equal(true)
  expect(isObject({ 'constructor': {} })).equal(true)
  expect(isObject({ 'foo': 'bar' })).equal(true)
  expect(isObject(Object.create(null))).equal(true)
  expect(isObject(Object.prototype)).equal(true)
}
