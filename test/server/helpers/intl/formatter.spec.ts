import { Formatter } from '../../../../src/server/helpers/intl'
import { expect } from 'chai'

describe('Formatter', () => {
  const data = {
    name: 'scola'
  }

  const locale = 'en'

  Formatter.strings = {
    en: {
      key: 'value-en',
      key_with_data: 'value-en {name}'
    },
    nl: {
      key: 'value-nl',
      key_with_data: 'value-nl {name}'
    }
  }

  function createFormatter (): Formatter {
    return new Formatter()
  }

  describe('should lookup a code', () => {
    it('with lowercase value', () => {
      expect(Formatter.lookup('value-nl')).equal('key')
    })

    it('with uppercase value', () => {
      expect(Formatter.lookup('VALUE-nl')).equal('key')
    })

    it('with non-existent locale', () => {
      expect(Formatter.lookup('value-de', 'de')).equal(undefined)
    })
  })

  describe('should format a value', () => {
    it('without data and without locale', () => {
      const formatter = createFormatter()
      expect(formatter.format('key')).equal('value-nl')
    })

    it('with data and without locale', () => {
      const formatter = createFormatter()
      expect(formatter.format('key_with_data', data)).equal('value-nl scola')
    })

    it('without data and with locale', () => {
      const formatter = createFormatter()
      expect(formatter.format('key', null, locale)).equal('value-en')
    })

    it('with data and with locale', () => {
      const formatter = createFormatter()
      expect(formatter.format('key_with_data', data, locale)).equal('value-en scola')
    })

    it('statically', () => {
      expect(Formatter.format('value {name}', data)).equal('value scola')
    })
  })

  describe('should return a code when', () => {
    it('value was not found', () => {
      const formatter = createFormatter()
      expect(formatter.format('no-value')).equal('no-value')
    })

    it('value was not found (with locale)', () => {
      const formatter = createFormatter()
      expect(formatter.format('no-value', null, locale)).equal('no-value')
    })

    it('value was not found (with non-existent locale)', () => {
      const formatter = createFormatter()
      expect(formatter.format('no-value', null, 'de')).equal('no-value')
    })

    it('data is missing', () => {
      const formatter = createFormatter()
      expect(formatter.format('key_with_data', {})).equal('key_with_data')
    })
  })
})
