import { Pool } from 'pg'
import { PostgresqlConnection } from '../../../../../src/server/helpers/sql/postgresql'
import { expect } from 'chai'

describe('PostgresqlConnection', () => {
  describe('should fail to', () => {
    it('transform an undefined parameter', transformAnUndefinedParameter)
  })

  describe('should', () => {
    it('transform parameters', transformParameters)
    it('transform parameters for bulk insert', transformParametersForBulkInsert)
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
  helpers.pool = new Pool({
    database: 'scola',
    host: 'postgres',
    password: 'root',
    user: 'root'
  })

  await helpers.pool.query(`CREATE TABLE test_connection (
    id SERIAL PRIMARY KEY,
    name VARCHAR NULL,
    value VARCHAR NULL
  )`)
})

beforeEach(async () => {
  await helpers.pool.query('TRUNCATE test_connection RESTART IDENTITY')
})

afterAll(async () => {
  await helpers.pool.query('DROP TABLE test_connection')
  await helpers.pool.end()
})

async function deleteOneRow (): Promise<void> {
  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    const { id } = await connection.insertOne(`
      INSERT INTO test_connection (
        name,
        value
      ) VALUES (
        $(name),
        $(value)
      )
    `, {
      name: 'name-insert',
      value: 'value-insert'
    })

    await connection.delete(`
      DELETE FROM test_connection
      WHERE id = $(id)
    `, {
      id
    })

    const data = await connection.selectOne(`
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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    const { id } = await connection.insertOne(`
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

    const data = await connection.selectOne(`
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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    const [{ id }] = await connection.insert(`
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

    const data = await connection.select(`
      SELECT *
      FROM test_connection
    `)

    expect(data).deep.members(expectedData)
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
    id: 1,
    name: 'name1',
    value: 'value1'
  }, {
    id: 2,
    name: 'name2',
    value: 'value2'
  }]

  const connection = new PostgresqlConnection(await helpers.pool.connect())

  await connection.insert(`
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

  const stream = connection.stream(`
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
      test = $1 AND
      test = $2 AND
      test = $3 AND
      test = $4 AND
      test = $5
  `

  const expectedValues = [1, null, 1, '{"number":3}', 'value']

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
    const [query, values] = connection.transform(rawQuery, rawValues)
    expect(query).equal(expectedQuery)
    expect(values).deep.equal(expectedValues)
  } finally {
    connection.release()
  }
}

async function transformParametersForBulkInsert (): Promise<void> {
  const expectedQuery = `
    INSERT INTO test_connection (
      name,
      value
    ) VALUES ('name1', 'value1'), ('name2', 'value2')
  `

  const expectedValues: [] = []

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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

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
    FROM test_connection
    WHERE test = $(test1)
  `

  const rawValues = {
    test2: 2
  }

  const connection = new PostgresqlConnection(await helpers.pool.connect())

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

  const connection = new PostgresqlConnection(await helpers.pool.connect())

  try {
    const { id } = await connection.insertOne(`
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

    await connection.update(`
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

    const data = await connection.selectOne(`
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
