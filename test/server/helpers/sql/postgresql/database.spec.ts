import { PostgresqlConnection, PostgresqlDatabase } from '../../../../../src/server/helpers/sql/postgresql'
import { GenericContainer } from 'testcontainers'
import { Pool } from 'pg'
import type { PoolConfig } from 'pg'
import type { StartedTestContainer } from 'testcontainers'
import { expect } from 'chai'

describe('PostgresqlConnection', () => {
  describe('should', () => {
    it('parse a DSN', parseADSN)
    it('connect with object options', connectWithObjectOptions)
    it('connect with string options', connectWithStringOptions)
    it('execute a query', executeAQuery)
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
const HOSTNAME = '127.0.0.1'
const PASSWORD = 'password'
const PORT = 5432
const USERNAME = 'root'

const DSN = `mysql://${USERNAME}:${PASSWORD}@${HOSTNAME}:${PORT}/${DATABASE}?max=20`

const helpers = new Helpers()

beforeAll(async () => {
  helpers.container = await new GenericContainer('postgres:13-alpine')
    .withExposedPorts(5432)
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

function createDatabase (options?: PoolConfig | string): PostgresqlDatabase {
  const database = new PostgresqlDatabase(options)
  database.pool = helpers.pool
  return database
}

async function deleteOneRow (): Promise<void> {
  const database = createDatabase()

  const { id } = await database.insertOne(`
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

  await database.delete(`
    DELETE FROM test
    WHERE id = $(id)
  `, {
    id
  })

  const data = await database.selectOne(`
    SELECT *
    FROM test
    WHERE id = $(id)
  `, {
    id
  })

  expect(data).equal(undefined)
  expect(database.pool.idleCount).gt(0)
}

async function executeAQuery (): Promise<void> {
  const database = createDatabase()

  await database.query(`
    SELECT 1
  `)

  expect(database.pool.idleCount).gt(0)
}

async function insertOneRow (): Promise<void> {
  const expectedData = {
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }

  const database = createDatabase()

  const { id } = await database.insertOne(`
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

  const data = await database.selectOne(`
    SELECT *
    FROM test
    WHERE id = $(id)
  `, {
    id
  })

  expect(data).include(expectedData)
  expect(database.pool.idleCount).gt(0)
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

  const database = createDatabase()

  const [{ id }] = await database.insert(`
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

  const data = await database.select(`
    SELECT *
    FROM test
  `)

  expect(data).deep.members(expectedData)
  expect(database.pool.idleCount).gt(0)
}

async function connectWithObjectOptions (): Promise<void> {
  const database = createDatabase(PostgresqlDatabase.parseDSN(DSN))
  const connection = await database.connect()

  try {
    expect(connection).instanceOf(PostgresqlConnection)
  } finally {
    connection.release()
  }
}

async function connectWithStringOptions (): Promise<void> {
  const database = createDatabase(DSN)
  const connection = await database.connect()

  try {
    expect(connection).instanceOf(PostgresqlConnection)
  } finally {
    connection.release()
  }
}

function parseADSN (): void {
  const expectedOptions = {
    connectionString: DSN,
    max: '20'
  }

  const options = PostgresqlDatabase.parseDSN(DSN)
  expect(options).eql(expectedOptions)
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

  const database = createDatabase()

  await database.insert(`
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

  const stream = await database.stream(`
    SELECT *
    FROM test
  `)

  return new Promise((resolve, reject) => {
    stream.on('data', (datum) => {
      data.push(datum)
    })

    stream.on('close', () => {
      try {
        expect(data).deep.members(expectedData)
        expect(database.pool.idleCount).gt(0)
        resolve()
      } catch (error: unknown) {
        reject(error)
      }
    })
  })
}

async function updateOneRow (): Promise<void> {
  const expectedData = {
    id: 1,
    name: 'name-update',
    value: 'value-update'
  }

  const database = createDatabase()

  const { id } = await database.insertOne(`
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

  await database.update(`
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

  const data = await database.selectOne(`
    SELECT *
    FROM test
    WHERE id = $(id)
  `, {
    id
  })

  expect(data).include(expectedData)
  expect(database.pool.idleCount).gt(0)
}
