import { expect } from 'chai'
import { format } from '../../../../src/common/helpers/intl/format'

describe('format', () => {
  describe('should', () => {
    describe('format a string', formatAString)
    describe('throw an error', throwAnError)
  })
})

const data = {
  name: 'scola'
}

const strings = {
  en: {
    hello: 'Hello',
    hello_name: 'Hello {name}'
  }
}

function formatAString (): void {
  it('directly', () => {
    expect(format(strings, 'Hello {name}', 'en', data)).equal('Hello scola')
  })

  it('of a non-existent code', () => {
    expect(format(strings, 'name', 'en')).equal('name')
  })

  it('of a non-existent locale', () => {
    expect(format(strings, 'hello_name', 'nl')).equal('hello_name')
  })

  it('without data and with locale', () => {
    expect(format(strings, 'hello', 'en')).equal('Hello')
  })

  it('with data and with locale', () => {
    expect(format(strings, 'hello_name', 'en', data)).equal('Hello scola')
  })
}

function throwAnError (): void {
  it('data is missing', () => {
    try {
      format(strings, 'hello_name', 'en', {})
    } catch (error: unknown) {
      expect(String(error)).match(/The intl string context variable "name" was not provided/u)
    }
  })
}
