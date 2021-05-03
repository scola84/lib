import { MysqlConnection } from '../../../../../src/server/helpers/sql/mysql'
import type { Pool } from 'mysql2/promise'
import { createPool } from 'mysql2/promise'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('MysqlConnection', () => {
  describe('should fail to', () => {
    it('transform an undefined parameter', transformAnUndefinedParameter)
  })

  describe('should', () => {
    it('transform parameters', transformParameters)
    it('release connection', releaseConnection)
    it('insert one row', insertOneRow)
    it('insert two rows', insertTwoRows)
    it('update one row', updateOneRow)
    it('delete one row', deleteOneRow)
    it('stream rows', streamRows)
  })
})

class Helpers {
  public pool: Pool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.pool = createPool({
    database: 'scola',
    password: 'root',
    user: 'root'
  })

  await helpers.pool.query(sql`CREATE TABLE test_connection (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    value VARCHAR(255) NULL
  )`)
})

afterEach(async () => {
  await helpers.pool.query(sql`TRUNCATE test_connection`)
})

afterAll(async () => {
  await helpers.pool.query(sql`DROP TABLE test_connection`)
  await helpers.pool.end()
})

async function deleteOneRow (): Promise<void> {
  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const { id } = await connection.insertOne(sql`
      INSERT INTO test_connection (
        name,
        value
      ) VALUES (
        $(name),
        $(value)
      )
    `, {
      name: 'name1',
      value: 'value1'
    })

    const { count } = await connection.delete(sql`
      DELETE FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(count).equal(1)

    const data = await connection.selectOne(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).equal(undefined)
  } finally {
    connection.release()
  }
}

async function insertOneRow (): Promise<void> {
  const expectedData = {
    id: 1,
    name: 'name1',
    value: 'value1'
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const { id } = await connection.insertOne(sql`
      INSERT INTO test_connection (
        name,
        value
      ) VALUES (
        $(name),
        $(value)
      )
    `, {
      name: 'name1',
      value: 'value1'
    })

    expect(id).equal(1)

    const data = await connection.selectOne(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).include(expectedData)
  } finally {
    connection.release()
  }
}

async function insertTwoRows (): Promise<void> {
  const expectedData = [{
    id: 1,
    name: 'name1',
    value: 'value1'
  }, {
    id: 2,
    name: 'name2',
    value: 'value2'
  }]

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const [{ id }] = await connection.insert(sql`
      INSERT INTO test_connection (
        name,
        value
      ) VALUES $(list)
    `, {
      list: [
        ['name1', 'value1'],
        ['name2', 'value2']
      ]
    })

    expect(id).equal(1)

    const data = await connection.select(sql`
      SELECT *
      FROM test_connection
    `)

    expect(data).deep.members(expectedData)
  } finally {
    connection.release()
  }
}

async function releaseConnection (): Promise<void> {
  const connection = new MysqlConnection(await helpers.pool.getConnection())

  return new Promise((resolve, reject) => {
    helpers.pool.once('release', (releasedConnection: MysqlConnection['connection']) => {
      try {
        expect(releasedConnection.threadId).equal(connection.connection.threadId)
        resolve()
      } catch (error: unknown) {
        reject(error)
      }
    })

    connection.release()
  })
}

async function streamRows (): Promise<void> {
  const data: unknown[] = []

  const expectedData = [{
    id: 1,
    name: 'name1',
    value: 'value1'
  }, {
    id: 2,
    name: 'name2',
    value: 'value2'
  }]

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  await connection.insert(sql`
    INSERT INTO test_connection (
      name,
      value
    ) VALUES $(list)
  `, {
    list: [
      ['name1', 'value1'],
      ['name2', 'value2']
    ]
  })

  const stream = connection.stream(sql`
    SELECT *
    FROM test_connection
  `)

  return new Promise((resolve, reject) => {
    stream.on('data', (datum) => {
      data.push(datum)
    })

    stream.on('end', () => {
      try {
        connection.release()
        expect(data).deep.members(expectedData)
        resolve()
      } catch (error: unknown) {
        reject(error)
      }
    })
  })
}

async function transformParameters (): Promise<void> {
  const expectedQuery = `
    SELECT *
    FROM test_connection
    WHERE
      test = ? AND
      test = ? AND
      test = ? AND
      test = ?
  `

  const expectedValues = [1, null, 1, '{"number":3}']

  const rawQuery = `
    SELECT *
    FROM test_connection
    WHERE
      test = $(test1) AND
      test = $(test2) AND
      test = $(test1) AND
      test = $(test3)
  `

  const rawValues = {
    test1: 1,
    test2: null,
    test3: {
      number: 3
    }
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const [query, values] = connection.transform(rawQuery, rawValues)
    expect(query).equal(expectedQuery)
    expect(values).deep.equal(expectedValues)
  } finally {
    connection.release()
  }
}

async function transformAnUndefinedParameter (): Promise<void> {
  const rawQuery = `
    SELECT *
    FROM test
    WHERE test = $(test1)
  `

  const rawValues = {
    test2: 2
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    connection.transform(rawQuery, rawValues)
  } catch (error: unknown) {
    expect(String(error)).match(/Parameter "test1" is undefined/u)
  } finally {
    connection.release()
  }
}

async function updateOneRow (): Promise<void> {
  const expectedData = {
    id: 1,
    name: 'name1-update',
    value: 'value1-update'
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const { id } = await connection.insertOne(sql`
      INSERT INTO test_connection (
        name,
        value
      ) VALUES (
        $(name),
        $(value)
      )
    `, {
      name: 'name1',
      value: 'value1'
    })

    const { count } = await connection.update(sql`
      UPDATE test_connection
      SET
        name = $(name),
        value = $(value)
      WHERE id = $(id)
    `, {
      id,
      name: 'name1-update',
      value: 'value1-update'
    })

    expect(count).equal(1)

    const data = await connection.selectOne(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).include(expectedData)
  } finally {
    connection.release()
  }
}
