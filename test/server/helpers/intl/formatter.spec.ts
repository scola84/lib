import { Formatter } from '../../../../src/server/helpers/intl'
import { expect } from 'chai'

describe('Formatter', () => {
  describe('should', () => {
    describe('format a string', formatAString)
    describe('lookup a code', lookupACode)
    describe('parse a string', parseAString)
    describe('throw an error', throwAnError)
  })
})

Formatter.strings = {
  en: {
    hello: 'Hello',
    hello_name: 'Hello {name}',
    spaced_name: 'Spaced Name'
  }
}

const data = {
  name: 'scola'
}

function formatAString (): void {
  it('directly', () => {
    expect(new Formatter().format('Hello {name}', 'en', data)).equal('Hello scola')
  })

  it('of a non-existent code', () => {
    expect(new Formatter().format('name', 'en')).equal('name')
  })

  it('of a non-existent locale', () => {
    expect(new Formatter().format('hello_name', 'nl')).equal('hello_name')
  })

  it('without data and without locale', () => {
    expect(new Formatter().format('hello')).equal('Hello')
  })

  it('with data and without locale', () => {
    expect(new Formatter().format('hello_name', undefined, data)).equal('Hello scola')
  })

  it('without data and with locale', () => {
    expect(new Formatter().format('hello', 'en')).equal('Hello')
  })

  it('with data and with locale', () => {
    expect(new Formatter().format('hello_name', 'en', data)).equal('Hello scola')
  })
}

function lookupACode (): void {
  it('of a lowercase string', () => {
    expect(new Formatter().lookup('Hello')).equal('hello')
  })

  it('of an uppercase string', () => {
    expect(new Formatter().lookup('HELLO')).equal('hello')
  })

  it('of a non-existent string', () => {
    expect(new Formatter().lookup('Name', 'en')).equal(undefined)
  })

  it('of a string of a non-existent locale', () => {
    expect(new Formatter().lookup('Hello', 'nl')).equal(undefined)
  })
}

function parseAString (): void {
  it('which has an undefined name', () => {
    const string = 'Name:Value'

    const expected: unknown[] = [{
      name: 'Name',
      value: 'Value'
    }]

    expect(new Formatter().parse(string, 'en')).eql(expected)
  })

  it('which has multiple queries', () => {
    const string = '"Spaced Name":"Spaced Value 1" "Spaced Value 2" regular'

    const expected = [{
      name: 'spaced_name',
      value: 'Spaced Value 1'
    }, {
      value: 'Spaced Value 2'
    }, {
      value: 'regular'
    }]

    expect(new Formatter().parse(string, 'en')).eql(expected)
  })

  it('which is empty', () => {
    const string = ''
    const expected: unknown[] = []

    expect(new Formatter().parse(string, 'en')).eql(expected)
  })

  it('without locale', () => {
    const string = '"Spaced Name":"Spaced Value 1"'

    const expected: unknown[] = [{
      name: 'spaced_name',
      value: 'Spaced Value 1'
    }]

    expect(new Formatter().parse(string)).eql(expected)
  })
}

function throwAnError (): void {
  it('data is missing', () => {
    try {
      new Formatter().format('hello_name', 'en', {})
    } catch (error: unknown) {
      expect(String(error)).match(/The intl string context variable "name" was not provided/u)
    }
  })
}
