import { ConnectionPool } from 'mssql'
import { MssqlConnection } from '../../../../../src/server/helpers/sql/mssql'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('MssqlConnection', () => {
  describe('should fail to', () => {
    it('transform an undefined parameter', transformAnUndefinedParameter)
  })

  describe('should', () => {
    it('delete one row', deleteOneRow)
    it('insert one row', insertOneRow)
    it('insert two rows', insertTwoRows)
    it('release connection', releaseConnection)
    it('stream rows', streamRows)
    it('transform parameters', transformParameters)
    it('transform parameters for bulk insert', transformParametersForBulkInsert)
    it('update one row', updateOneRow)
  })
})

interface PoolWithNumbers {
  available: number
  borrowed: number
  pending: number
  size: number
}

class Helpers {
  public pool: ConnectionPool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.pool = new ConnectionPool({
    options: {
      enableArithAbort: true
    },
    password: 'rootRoot1',
    server: 'localhost',
    user: 'sa'
  })

  await helpers.pool.connect()
  await helpers.pool.query(sql`CREATE DATABASE scola`)
  await helpers.pool.query(sql`USE scola`)

  await helpers.pool.query(sql`CREATE TABLE test_connection (
    id INT NOT NULL PRIMARY KEY IDENTITY (1, 1),
    name VARCHAR(255) NULL,
    value VARCHAR(255) NULL
  )`)
})

afterEach(async () => {
  await helpers.pool.query(sql`TRUNCATE TABLE test_connection`)
})

afterAll(async () => {
  await helpers.pool.query(sql`USE master`)
  await helpers.pool.query(sql`DROP DATABASE scola`)
  await helpers.pool.close()
})

async function deleteOneRow (): Promise<void> {
  const connection = new MssqlConnection(helpers.pool.request())

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

  const connection = new MssqlConnection(helpers.pool.request())

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

  const connection = new MssqlConnection(helpers.pool.request())

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

    expect(id).equal(2)

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
  const connection = new MssqlConnection(helpers.pool.request())
  const pool = helpers.pool as unknown as PoolWithNumbers

  return new Promise((resolve, reject) => {
    try {
      connection.release()
      expect(pool.available).equal(pool.size)
      resolve()
    } catch (error: unknown) {
      reject(error)
    }
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

  const connection = new MssqlConnection(helpers.pool.request())

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

function transformAnUndefinedParameter (): void {
  const rawQuery = `
    SELECT *
    FROM test
    WHERE test = $(test1)
  `

  const rawValues = {
    test2: 2
  }

  const connection = new MssqlConnection(helpers.pool.request())

  try {
    connection.transform(rawQuery, rawValues)
  } catch (error: unknown) {
    expect(String(error)).match(/Parameter "test1" is undefined/u)
  } finally {
    connection.release()
  }
}

function transformParameters (): void {
  const expectedQuery = `
    SELECT *
    FROM test_connection
    WHERE
      test = 1 AND
      test = NULL AND
      test = 1 AND
      test = '{\\"number\\":3}' AND
      test = 'value'
  `

  const rawQuery = `
    SELECT *
    FROM test_connection
    WHERE
      test = $(test1) AND
      test = $(test2) AND
      test = $(test1) AND
      test = $(test3) AND
      test = $(test4)
  `

  const rawValues = {
    test1: 1,
    test2: null,
    test3: {
      number: 3
    },
    test4: 'value'
  }

  const connection = new MssqlConnection(helpers.pool.request())

  try {
    const query = connection.transform(rawQuery, rawValues)
    expect(query).equal(expectedQuery)
  } finally {
    connection.release()
  }
}

function transformParametersForBulkInsert (): void {
  const expectedQuery = `
    INSERT INTO test_connection (
      name,
      value
    ) VALUES ('name1', 'value1'), ('name2', 'value2')
  `

  const rawQuery = `
    INSERT INTO test_connection (
      name,
      value
    ) VALUES $(list)
  `

  const rawValues = {
    list: [
      ['name1', 'value1'],
      ['name2', 'value2']
    ]
  }

  const connection = new MssqlConnection(helpers.pool.request())

  try {
    const query = connection.transform(rawQuery, rawValues)
    expect(query).equal(expectedQuery)
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

  const connection = new MssqlConnection(helpers.pool.request())

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
