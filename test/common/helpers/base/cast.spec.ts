import { cast } from '../../../../src/common/helpers/base/cast'
import { expect } from 'chai'

describe('cast', () => {
  describe('should cast', () => {
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

function aNumber (): void {
  expect(cast(1.234)).equal(1.234)
  expect(cast('1.234')).equal(1.234)
}

function aString (): void {
  expect(cast('foo')).equal('foo')
}
