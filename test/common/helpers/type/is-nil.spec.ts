import { expect } from 'chai'
import { isNil } from '../../../../src/common/helpers/is-nil'

describe('isNil', () => {
  it('should return false for non-nils', returnFalseForNonNils)
  it('should return true for nils', returnTrueForNils)
})

class Foo {
  public bar: string
}

function returnFalseForNonNils (): void {
  expect(isNil(BigInt(0))).eq(false)
  expect(isNil(true)).eq(false)
  expect(isNil(0)).eq(false)
  expect(isNil('')).eq(false)
  expect(isNil(Symbol(''))).eq(false)
  expect(isNil([1, 2, 3])).eq(false)
  expect(isNil({})).eq(false)
  expect(isNil({ 'constructor': {} })).eq(false)
  expect(isNil({ 'foo': 'bar' })).eq(false)
  expect(isNil(Object.create(null))).eq(false)
  expect(isNil(Object.prototype)).eq(false)
  expect(isNil(() => {})).eq(false)
  expect(isNil(Math)).eq(false)
  expect(isNil(new Foo())).eq(false)
}

function returnTrueForNils (): void {
  expect(isNil(undefined)).eq(true)
  expect(isNil(null)).eq(true)
}
