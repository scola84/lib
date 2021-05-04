import { expect, use } from 'chai'
import { Pool } from 'pg'
import { PostgresqlConnection } from '../../../../../src/server/helpers/sql/postgresql'
import { sql } from '../../../../../src/server/helpers/sql/tag'
import subset from 'chai-subset'

describe('PostgresqlConnection', () => {
  use(subset)

  describe('should fail to', () => {
    it('format a query with an undefined parameter', formatAQueryWithAnUndefinedParameter)
  })

  describe('should', () => {
    it('delete one row', deleteOneRow)
    it('format a query', formatAQuery)
    it('format a query for bulk insert', formatAQueryForBulkInsert)
    it('insert a bulk of rows', insertABulkOfRows)
    it('insert one row', insertOneRow)
    it('release connection', releaseConnection)
    it('stream rows', streamRows)
    it('update one row', updateOneRow)
  })
})

class Helpers {
  public pool: Pool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.pool = new Pool({
    database: 'scola',
    password: 'root',
    user: 'root'
  })

  await helpers.pool.query(sql`CREATE TABLE test_connection (
    id serial PRIMARY KEY,
    name varchar NULL,
    value_boolean boolean NULL,
    value_json json NULL,
    value_number int NULL,
    value_string varchar NULL
  )`)
})

beforeEach(async () => {
  await helpers.pool.query(sql`TRUNCATE test_connection RESTART IDENTITY`)
})

afterAll(async () => {
  await helpers.pool.query(sql`DROP TABLE test_connection`)
  await helpers.pool.end()
})

async function deleteOneRow (): Promise<void> {
  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    const { id } = await connection.insertOne(sql`
      INSERT INTO test_connection (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    await connection.delete(sql`
      DELETE FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

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

async function formatAQuery (): Promise<void> {
  const expectedQuery = `
    SELECT *
    FROM test_connection
    WHERE
      test = '1' AND
      test = NULL AND
      test = '1' AND
      test = '{"number":3}'::jsonb AND
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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

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
    FROM test_connection
    WHERE test = $(test1)
  `

  const rawValues = {
    test2: 2
  }

  const connection = new PostgresqlConnection(await helpers.pool.connect())

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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    const [{ id }] = await connection.insert(sql`
      INSERT INTO test_connection (name)
      VALUES $(list)
    `, {
      list: [
        ['name1'],
        ['name2']
      ]
    })

    expect(id).equal(1)

    const data = await connection.select(sql`
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
    ...insertData
  }

  const connection = new PostgresqlConnection(await helpers.pool.connect())

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

async function releaseConnection (): Promise<void> {
  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    expect(helpers.pool.idleCount).equal(0)
    connection.release()
    expect(helpers.pool.idleCount).equal(1)
  } finally {
    if (helpers.pool.idleCount === 0) {
      connection.release()
    }
  }
}

async function streamRows (): Promise<void> {
  const data: unknown[] = []

  const expectedData = [{
    name: 'name1'
  }, {
    name: 'name2'
  }]

  const connection = new PostgresqlConnection(await helpers.pool.connect())

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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    const { id } = await connection.insertOne(sql`
      INSERT INTO test_connection (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    await connection.update(sql`
      UPDATE test_connection
      SET name = $(name)
      WHERE id = $(id)
    `, {
      id,
      name: 'name-update'
    })

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
