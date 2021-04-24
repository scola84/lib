import { GenericContainer } from 'testcontainers'
import { Pool } from 'pg'
import { PostgresqlConnection } from '../../../../../src/server/helpers/sql/postgresql'
import type { StartedTestContainer } from 'testcontainers'
import { expect } from 'chai'

describe('PostgresqlConnection', () => {
  describe('should', () => {
    it('transform parameters', transformParameters)
    it('release connection', releaseConnection)
    it('insert one row', insertOneRow)
    it('insert two rows', insertTwoRows)
    it('update one row', updateOneRow)
    it('delete one row', deleteOneRow)
    it('stream rows', streamRows)
  })

  describe('should fail to', () => {
    it('transform an undefined parameter', transformAnUndefinedParameter)
  })
})

const dbname = 'scola'
const username = 'root'
const password = 'password'
const port = 5432

let container: StartedTestContainer | null = null
let pool: Pool | null = null

beforeAll(async () => {
  container = await new GenericContainer('postgres:13-alpine')
    .withExposedPorts(port)
    .withEnv('POSTGRES_DB', dbname)
    .withEnv('POSTGRES_PASSWORD', password)
    .withEnv('POSTGRES_USER', username)
    .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
    .start()

  pool = new Pool({
    database: dbname,
    host: container.getHost(),
    password,
    port: container.getMappedPort(port),
    user: username
  })

  await pool.query(`CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    name VARCHAR NULL,
    value VARCHAR NULL
  )`)
})

afterAll(async () => {
  await pool?.end()
  await container?.stop()
})

beforeEach(async () => {
  await pool?.query('TRUNCATE test RESTART IDENTITY')
})

async function createConnection (): Promise<PostgresqlConnection> {
  if (pool === null) {
    throw new Error('Pool is null')
  }

  return new PostgresqlConnection(await pool.connect())
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
  const connection = await createConnection()

  const expectedData = {
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }

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
  const connection = await createConnection()

  try {
    const expectedData = [{
      id: 1,
      name: 'name-insert',
      value: 'value-insert'
    }, {
      id: 2,
      name: 'name-insert',
      value: 'value-insert'
    }]

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
    expect(pool?.idleCount).equal(0)
    connection.release()
    expect(pool?.idleCount).equal(1)
  } finally {
    if (pool?.idleCount === 0) {
      connection.release()
    }
  }
}

async function streamRows (finish: (error?: Error | null) => void): Promise<void> {
  const connection = await createConnection()
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

  stream.on('data', (datum) => {
    data.push(datum)
  })

  stream.on('end', () => {
    connection.release()

    try {
      expect(data).deep.members(expectedData)
      finish()
    } catch (error: unknown) {
      finish(error as Error)
    }
  })
}

async function transformParameters (): Promise<void> {
  const connection = await createConnection()

  const expectedQuery = `
    SELECT *
    FROM test
    WHERE
    test1 = $1 AND
    test2 = $2 AND
    test3 = $3 AND
    test4 = $4
  `

  const rawQuery = `
    SELECT *
    FROM test
    WHERE
    test1 = $(test1) AND
    test2 = $(test2) AND
    test3 = $(test1) AND
    test4 = $(test3)
  `

  const expectedValues = [1, 2, 1, '{"number":3}']

  const rawValues = {
    test1: 1,
    test2: 2,
    test3: {
      number: 3
    }
  }

  try {
    const [query, values] = connection.transform(rawQuery, rawValues)
    expect(query).equal(expectedQuery)
    expect(values).deep.equal(expectedValues)
  } finally {
    connection.release()
  }
}

async function transformAnUndefinedParameter (): Promise<void> {
  const connection = await createConnection()

  const rawQuery = `
    SELECT *
    FROM test
    WHERE test = $(test1)
  `

  const rawValues = {
    test2: 2
  }

  try {
    connection.transform(rawQuery, rawValues)
  } catch (error: unknown) {
    expect(String(error)).match(/Parameter "test1" is undefined/u)
  } finally {
    connection.release()
  }
}

async function updateOneRow (): Promise<void> {
  const connection = await createConnection()

  const expectedData = {
    id: 1,
    name: 'name-update',
    value: 'value-update'
  }

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
