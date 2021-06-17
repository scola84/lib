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

const locale = 'nl'

Formatter.strings = {
  en: {
    hello: 'Hello',
    hello_name: 'Hello {name}'
  },
  nl: {
    hello: 'Hallo',
    hello_name: 'Hallo {name}'
  }
}

function formatAValue (): void {
  it('without data and without locale', () => {
    expect(new Formatter().format('hello')).equal('Hello')
  })

  it('with data and without locale', () => {
    expect(new Formatter().format('hello_name', undefined, data)).equal('Hello scola')
  })

  it('without data and with locale', () => {
    expect(new Formatter().format('hello', locale)).equal('Hallo')
  })

  it('with data and with locale', () => {
    expect(new Formatter().format('hello_name', locale, data)).equal('Hallo scola')
  })
}

function lookupACode (): void {
  it('with lowercase value', () => {
    expect(new Formatter().lookup('Hello')).equal('hello')
  })

  it('with uppercase value', () => {
    expect(new Formatter().lookup('HELLO')).equal('hello')
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
    expect(new Formatter().format('hello_name', locale, {})).equal('hello_name')
  })
}
