import { cast } from '../../../../src'
import { expect } from 'chai'

describe('cast', () => {
  describe('should cast', () => {
    it('a null', aNull)
    it('a undefined', aUndefined)
    it('a boolean', aBoolean)
    it('a number', aNumber)
    it('a string', aString)
  })
})

function aBoolean (): void {
  expect(cast(true)).equal(true)
  expect(cast('true')).equal(true)
  expect(cast(false)).equal(false)
  expect(cast('false')).equal(false)
}

function aNull (): void {
  expect(cast(null)).equal(null)
  expect(cast('null')).equal(null)
}

function aNumber (): void {
  expect(cast(1.234)).equal(1.234)
  expect(cast('1.234')).equal(1.234)
}

function aString (): void {
  expect(cast('foo')).equal('foo')
}

function aUndefined (): void {
  expect(cast(undefined)).equal(undefined)
  expect(cast('undefined')).equal(null)
}
