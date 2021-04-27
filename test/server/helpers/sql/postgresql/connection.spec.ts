import { GenericContainer } from 'testcontainers'
import { Pool } from 'pg'
import { PostgresqlConnection } from '../../../../../src/server/helpers/sql/postgresql'
import type { StartedTestContainer } from 'testcontainers'
import { expect } from 'chai'

describe('PostgresqlConnection', () => {
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
  public container: StartedTestContainer
  public pool: Pool
}

const DATABASE = 'scola'
const PASSWORD = 'password'
const PORT = 5432
const USERNAME = 'root'

const helpers = new Helpers()

beforeAll(async () => {
  helpers.container = await new GenericContainer('postgres:13-alpine')
    .withExposedPorts(PORT)
    .withEnv('POSTGRES_DB', DATABASE)
    .withEnv('POSTGRES_PASSWORD', PASSWORD)
    .withEnv('POSTGRES_USER', USERNAME)
    .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
    .start()

  helpers.pool = new Pool({
    database: DATABASE,
    host: helpers.container.getHost(),
    password: PASSWORD,
    port: helpers.container.getMappedPort(PORT),
    user: USERNAME
  })

  await helpers.pool.query(`CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    name VARCHAR NULL,
    value VARCHAR NULL
  )`)
})

afterAll(async () => {
  await helpers.pool.end()
  await helpers.container.stop()
})

beforeEach(async () => {
  await helpers.pool.query('TRUNCATE test RESTART IDENTITY')
})

async function createConnection (): Promise<PostgresqlConnection> {
  return new PostgresqlConnection(await helpers.pool.connect())
}

async function deleteOneRow (): Promise<void> {
  const connection = await createConnection()

  try {
    const { id } = await connection.insertOne(`
      INSERT INTO test (
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
      DELETE FROM test
      WHERE id = $(id)
    `, {
      id
    })

    const data = await connection.selectOne(`
      SELECT *
      FROM test
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
    name: 'name-insert',
    value: 'value-insert'
  }

  const connection = await createConnection()

  try {
    const { id } = await connection.insertOne(`
      INSERT INTO test (
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

    expect(id).equal(1)

    const data = await connection.selectOne(`
      SELECT *
      FROM test
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
    name: 'name-insert',
    value: 'value-insert'
  }, {
    id: 2,
    name: 'name-insert',
    value: 'value-insert'
  }]

  const connection = await createConnection()

  try {
    const [{ id }] = await connection.insert(`
      INSERT INTO test (
        name,
        value
      ) VALUES $(list)
    `, {
      list: [
        ['name-insert', 'value-insert'],
        ['name-insert', 'value-insert']
      ]
    })

    expect(id).equal(1)

    const data = await connection.select(`
      SELECT *
      FROM test
    `)

    expect(data).deep.members(expectedData)
  } finally {
    connection.release()
  }
}

async function releaseConnection (): Promise<void> {
  const connection = await createConnection()

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
    name: 'name-insert',
    value: 'value-insert'
  }, {
    id: 2,
    name: 'name-insert',
    value: 'value-insert'
  }]

  const connection = await createConnection()

  await connection.insert(`
    INSERT INTO test (
      name,
      value
    ) VALUES $(list)
  `, {
    list: [
      ['name-insert', 'value-insert'],
      ['name-insert', 'value-insert']
    ]
  })

  const stream = connection.stream(`
    SELECT *
    FROM test
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
    FROM test
    WHERE
    test1 = $1 AND
    test2 = $2 AND
    test3 = $3 AND
    test4 = $4
  `

  const expectedValues = [1, 2, 1, '{"number":3}']

  const rawQuery = `
    SELECT *
    FROM test
    WHERE
    test1 = $(test1) AND
    test2 = $(test2) AND
    test3 = $(test1) AND
    test4 = $(test3)
  `

  const rawValues = {
    test1: 1,
    test2: 2,
    test3: {
      number: 3
    }
  }

  const connection = await createConnection()

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

  const connection = await createConnection()

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
    name: 'name-update',
    value: 'value-update'
  }

  const connection = await createConnection()

  try {
    const { id } = await connection.insertOne(`
      INSERT INTO test (
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

    await connection.update(`
      UPDATE test
      SET
        name = $(name),
        value = $(value)
      WHERE id = $(id)
    `, {
      id,
      name: 'name-update',
      value: 'value-update'
    })

    const data = await connection.selectOne(`
      SELECT *
      FROM test
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).include(expectedData)
  } finally {
    connection.release()
  }
}
