import { expect } from 'chai'
import { parse } from '../../../../src/common/helpers/intl/parse'

const strings = {
  en: {
    spaced_name: 'Spaced Name'
  }
}

describe('parse', () => {
  describe('should parse a string which', () => {
    it('has an undefined name', hasAnUndefinedName)
    it('has multiple queries', hasMultipleQueries)
    it('is empty', isEmpty)
  })
})

function hasAnUndefinedName (): void {
  const string = 'Name:Value'

  const expected: unknown[] = [{
    name: 'Name',
    value: 'Value'
  }]

  expect(parse(strings, string, 'en')).eql(expected)
}

function hasMultipleQueries (): void {
  const string = '"Spaced Name":"Spaced Value 1" "Spaced Value 2" regular'

  const expected = [{
    name: 'spaced_name',
    value: 'Spaced Value 1'
  }, {
    value: 'Spaced Value 2'
  }, {
    value: 'regular'
  }]

  expect(parse(strings, string, 'en')).eql(expected)
}

function isEmpty (): void {
  const string = ''
  const expected: unknown[] = []

  expect(parse(strings, string, 'en')).eql(expected)
}
