import { MysqlFormatter } from '../../../../../src/server/helpers/sql/mysql'
import { expect } from 'chai'

describe('MysqlFormatter', () => {
  describe('should fail to', () => {
    it('format a query with an undefined parameter', formatAQueryWithAnUndefinedParameter)
  })

  describe('should', () => {
    it('format a query', formatAQuery)
    it('format a query for bulk insert', formatAQueryForBulkInsert)
  })
})

function formatAQuery (): void {
  const formatter = new MysqlFormatter()

  const expectedQuery = `
    SELECT *
    FROM \`scola\`.\`test_connection\`
    WHERE
      \`test\` = 1 AND
      \`test\` = NULL AND
      \`test\` = 1 AND
      \`test\` = '{\\"number\\":3}' AND
      \`test\` = 'value'
  `

  const rawString = `
    SELECT *
    FROM $[scola.test_connection]
    WHERE
      $[test] = $(test1) AND
      $[test] = $(test2) AND
      $[test] = $(test1) AND
      $[test] = $(test3) AND
      $[test] = $(test4)
  `

  const rawValues = {
    test1: 1,
    test2: null,
    test3: {
      number: 3
    },
    test4: 'value'
  }

  expect(formatter.formatQuery({
    string: rawString,
    values: rawValues
  })).equal(expectedQuery)
}

function formatAQueryForBulkInsert (): void {
  const formatter = new MysqlFormatter()

  const expectedQuery = `
    INSERT INTO test_connection (name)
    VALUES ('name1'), ('name2')
  `

  const string = `
    INSERT INTO test_connection (name)
    VALUES $(list)
  `

  const values = {
    list: [
      ['name1'],
      ['name2']
    ]
  }

  expect(formatter.formatQuery({
    string,
    values
  })).equal(expectedQuery)
}

function formatAQueryWithAnUndefinedParameter (): void {
  const string = `
    SELECT *
    FROM test_connection
    WHERE test = $(test1)
  `

  const values = {
    test2: 2
  }

  const formatter = new MysqlFormatter()

  try {
    formatter.formatQuery({
      string,
      values
    })
  } catch (error: unknown) {
    expect(String(error)).match(/Parameter "test1" is undefined/u)
  }
}
