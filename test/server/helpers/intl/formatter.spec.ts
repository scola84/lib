import { Formatter } from '../../../../src/server/helpers/intl'
import { expect } from 'chai'

describe('Formatter', () => {
  describe('should', () => {
    describe('format a value', formatAValue)
    describe('lookup a code', lookupACode)
    describe('return a code', returnACode)
  })
})

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

function formatAValue (): void {
  it('without data and without locale', () => {
    expect(new Formatter().format('key')).equal('value-nl')
  })

  it('with data and without locale', () => {
    expect(new Formatter().format('key_with_data', undefined, data)).equal('value-nl scola')
  })

  it('without data and with locale', () => {
    expect(new Formatter().format('key', locale)).equal('value-en')
  })

  it('with data and with locale', () => {
    expect(new Formatter().format('key_with_data', locale, data)).equal('value-en scola')
  })
}

function lookupACode (): void {
  it('with lowercase value', () => {
    expect(new Formatter().lookup('value-nl')).equal('key')
  })

  it('with uppercase value', () => {
    expect(new Formatter().lookup('VALUE-nl')).equal('key')
  })

  it('with non-existent locale', () => {
    expect(new Formatter().lookup('value-de', 'de')).equal(undefined)
  })
}

function returnACode (): void {
  it('value was not found', () => {
    expect(new Formatter().format('no-value')).equal('no-value')
  })

  it('value was not found (with locale)', () => {
    expect(new Formatter().format('no-value', locale)).equal('no-value')
  })

  it('value was not found (with non-existent locale)', () => {
    expect(new Formatter().format('no-value', 'de')).equal('no-value')
  })

  it('data is missing', () => {
    expect(new Formatter().format('key_with_data', locale, {})).equal('key_with_data')
  })
}
