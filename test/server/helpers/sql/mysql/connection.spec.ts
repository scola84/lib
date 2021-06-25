import { expect, use } from 'chai'
import { MysqlConnection } from '../../../../../src/server/helpers/sql/mysql'
import type { Pool } from 'mysql2/promise'
import { createPool } from 'mysql2/promise'
import { sql } from '../../../../../src/server/helpers/sql/tag'
import subset from 'chai-subset'

describe('MysqlConnection', () => {
  use(subset)

  describe('should fail to', () => {
    it('format a query with an undefined parameter', formatAQueryWithAnUndefinedParameter)
  })

  describe('should', () => {
    it('delete one row', deleteOneRow)
    it('depopulate', depopulate)
    it('format a query', formatAQuery)
    it('format a query for bulk insert', formatAQueryForBulkInsert)
    it('insert a bulk of rows', insertABulkOfRows)
    it('insert one row', insertOneRow)
    it('populate', populate)
    it('release connection', releaseConnection)
    it('select multiple rows', selectMultipleRows)
    it('select and resolve undefined', selectAndResolveUndefined)
    it('select one and reject undefined', selectOneAndRejectUndefined)
    it('stream rows', streamRows)
    it('update one row', updateOneRow)
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
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    value_boolean BOOLEAN NULL,
    value_json JSON NULL,
    value_number INT NULL,
    value_string VARCHAR(255) NULL
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
      INSERT INTO test_connection (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    const { count } = await connection.delete(sql`
      DELETE FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(count).equal(1)

    const data = await connection.select(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(id).equal(1)
    expect(data).equal(undefined)
  } finally {
    connection.release()
  }
}

async function depopulate (): Promise<void> {
  const populateData = {
    test_connection: [{
      id: 1,
      name: 'name',
      value_boolean: true,
      value_json: {
        value: 'json'
      },
      value_number: 1,
      value_string: 'string'
    }]
  }

  const depopulateData = {
    ...populateData
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    await connection.populate(populateData)
    await connection.depopulate(depopulateData)

    const data = await connection.select(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id: 1
    })

    expect(data).eql(undefined)
  } finally {
    connection.release()
  }
}

async function formatAQuery (): Promise<void> {
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

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const query = connection.format(rawQuery, rawValues)
    expect(query).equal(expectedQuery)
  } finally {
    connection.release()
  }
}

async function formatAQueryForBulkInsert (): Promise<void> {
  const expectedQuery = `
    INSERT INTO test_connection (name)
    VALUES ('name1'), ('name2')
  `

  const rawQuery = `
    INSERT INTO test_connection (name)
    VALUES $(list)
  `

  const rawValues = {
    list: [
      ['name1'],
      ['name2']
    ]
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const query = connection.format(rawQuery, rawValues)
    expect(query).equal(expectedQuery)
  } finally {
    connection.release()
  }
}

async function formatAQueryWithAnUndefinedParameter (): Promise<void> {
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
    connection.format(rawQuery, rawValues)
  } catch (error: unknown) {
    expect(String(error)).match(/Parameter "test1" is undefined/u)
  } finally {
    connection.release()
  }
}

async function insertABulkOfRows (): Promise<void> {
  const expectedData = [{
    name: 'name1'
  }, {
    name: 'name2'
  }]

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const [{ id }] = await connection.insertAll(sql`
      INSERT INTO test_connection (name)
      VALUES $(list)
    `, {
      list: [
        ['name1'],
        ['name2']
      ]
    })

    expect(id).equal(1)

    const data = await connection.selectAll(sql`
      SELECT *
      FROM test_connection
    `)

    expect(data).containSubset(expectedData)
  } finally {
    connection.release()
  }
}

async function insertOneRow (): Promise<void> {
  const insertData = {
    id: 1,
    name: 'name',
    value_boolean: true,
    value_json: {
      value: 'json'
    },
    value_number: 1,
    value_string: 'string'
  }

  const expectedData = {
    ...insertData,
    value_boolean: 1
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const { id } = await connection.insertOne(sql`
      INSERT INTO test_connection (
        name,
        value_boolean,
        value_json,
        value_number,
        value_string
      ) VALUES (
        $(name),
        $(value_boolean),
        $(value_json),
        $(value_number),
        $(value_string)
      )
    `, insertData)

    const data = await connection.selectOne(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(id).equal(1)
    expect(data).eql(expectedData)
  } finally {
    connection.release()
  }
}

async function populate (): Promise<void> {
  const populateData = {
    test_connection: [{
      id: 1,
      name: 'name',
      value_boolean: true,
      value_json: {
        value: 'json'
      },
      value_number: 1,
      value_string: 'string'
    }]
  }

  const expectedData = {
    ...populateData.test_connection[0],
    value_boolean: 1
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    await connection.populate(populateData)

    const data = await connection.selectOne(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id: 1
    })

    expect(data).eql(expectedData)
  } finally {
    connection.release()
  }
}

async function releaseConnection (): Promise<void> {
  const connection = new MysqlConnection(await helpers.pool.getConnection())

  const promise = new Promise<void>((resolve, reject) => {
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

  return promise
}

async function selectMultipleRows (): Promise<void> {
  const expectedData = [{
    name: 'name1'
  }, {
    name: 'name2'
  }]

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  await connection.insert(sql`
    INSERT INTO test_connection (name)
    VALUES $(list)
  `, {
    list: [
      ['name1'],
      ['name2']
    ]
  })

  const data = await connection.selectAll(sql`
    SELECT *
    FROM test_connection
  `)

  expect(data).containSubset(expectedData)
}

async function selectAndResolveUndefined (): Promise<void> {
  const connection = new MysqlConnection(await helpers.pool.getConnection())

  const object = await connection.select(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
    id: 1
  })

  expect(object).equal(undefined)
}

async function selectOneAndRejectUndefined (): Promise<void> {
  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    await connection.selectOne(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id: 1
    })
  } catch (error: unknown) {
    expect(String(error)).match(/Object is undefined/u)
  }
}

async function streamRows (): Promise<void> {
  const data: unknown[] = []

  const expectedData = [{
    name: 'name1'
  }, {
    name: 'name2'
  }]

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  await connection.insert(sql`
    INSERT INTO test_connection (name)
    VALUES $(list)
  `, {
    list: [
      ['name1'],
      ['name2']
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
        expect(data).containSubset(expectedData)
        resolve()
      } catch (error: unknown) {
        reject(error)
      }
    })
  })
}

async function updateOneRow (): Promise<void> {
  const expectedData = {
    name: 'name-update'
  }

  const connection = new MysqlConnection(await helpers.pool.getConnection())

  try {
    const { id } = await connection.insertOne(sql`
      INSERT INTO test_connection (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    const { count } = await connection.update(sql`
      UPDATE test_connection
      SET name = $(name)
      WHERE id = $(id)
    `, {
      id,
      name: 'name-update'
    })

    expect(count).equal(1)

    const data = await connection.selectOne(sql`
      SELECT *
      FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    expect(id).equal(1)
    expect(data).include(expectedData)
  } finally {
    connection.release()
  }
}
