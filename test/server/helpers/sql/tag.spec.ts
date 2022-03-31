import { expect } from 'chai'
import { sql } from '../../../../src/server/helpers/sql/tag'

describe('tag', () => {
  it('should return a string when values are passed', () => {
    const expectedString = `
      INSERT INTO test
      VALUES ('test')
    `

    const value = 'test'

    const string = sql`
      INSERT INTO test
      VALUES ('${value}')
    `

    expect(string).eq(expectedString)
  })

  it('should return a string when no values are passed', () => {
    const expectedString = `
      INSERT INTO test
      VALUES ('test')
    `

    const string = sql`
      INSERT INTO test
      VALUES ('test')
    `

    expect(string).eq(expectedString)
  })
})
