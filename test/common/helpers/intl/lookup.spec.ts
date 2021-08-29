import { expect } from 'chai'
import { lookup } from '../../../../src/common/helpers/intl/lookup'

const strings = {
  en: {
    hello: 'Hello',
    hello_name: 'Hello {name}'
  }
}

describe('lookup', () => {
  describe('should lookup a code', () => {
    it('of a lowercase string', () => {
      expect(lookup(strings, 'Hello', 'en')).equal('hello')
    })

    it('of an uppercase string', () => {
      expect(lookup(strings, 'HELLO', 'en')).equal('hello')
    })

    it('of a non-existent string', () => {
      expect(lookup(strings, 'Name', 'en')).equal(undefined)
    })

    it('of a string of a non-existent locale', () => {
      expect(lookup(strings, 'Hello', 'nl')).equal(undefined)
    })
  })
})
