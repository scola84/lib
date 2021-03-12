import { MysqlConnection } from '../../../../../src/server/helpers/sql'
import { expect } from 'chai'

describe('MysqlConnection', () => {
  describe('should succesfully', () => {
    it('transform placeholders from $(n) to ?', () => {
      const expectedQuery = `
        SELECT *
        FROM test
        WHERE test1 = ?
        AND test2 = ?
        AND test3 = ?
        AND test4 = ?
      `

      const rawQuery = `
        SELECT *
        FROM test
        WHERE test1 = $1
        AND test2 = $2
        AND test3 = $1
        AND test4 = $3
      `

      const expectedValues = [1, 2, 1, 3]
      const rawValues = [1, 2, 3]

      const connection = new MysqlConnection()
      const [query, values] = connection.transformPlaceholders(rawQuery, rawValues)

      expect(query).to.be.equal(expectedQuery)
      expect(values).to.be.deep.equal(expectedValues)
    })
  })
})
