import { cast } from '../../../../src/common/helpers/cast'
import { expect } from 'chai'

describe('cast', () => {
  describe('should cast', () => {
    it('a boolean', aBoolean)
    it('a date', aDate)
    it('a null', aNull)
    it('a number', aNumber)
    it('a string', aString)
    it('an object', anObject)
    it('an undefined', anUndefined)
  })
})

function aBoolean (): void {
  expect(cast(true)).eq(true)
  expect(cast('true')).eq(true)
  expect(cast('\'true\'')).eq('true')
  expect(cast(false)).eq(false)
  expect(cast('false')).eq(false)
  expect(cast('\'false\'')).eq('false')
}

function aDate (): void {
  const date = new Date()

  expect(cast(date)?.toString()).eq(date.toString())
  expect(cast(date.toString())?.toString()).eq(date.toString())
}

function aNull (): void {
  expect(cast(null)).eq(null)
  expect(cast('null')).eq(null)
  expect(cast('\'null\'')).eq('null')
}

function aNumber (): void {
  expect(cast(1.234)).eq(1.234)
  expect(cast('1.234')).eq(1.234)
}

function aString (): void {
  expect(cast('foo')).eq('foo')
}

function anObject (): void {
  expect(cast({ a: 'b' })).eq('{"a":"b"}')
}

function anUndefined (): void {
  expect(cast(undefined)).eq(undefined)
  expect(cast('undefined')).eq(undefined)
  expect(cast('\'undefined\'')).eq('undefined')
}
