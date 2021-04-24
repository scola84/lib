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

const dbname = 'scola'
const hostname = '127.0.0.1'
const username = 'root'
const password = 'password'
const port = 5432
const dsn = `mysql://${username}:${password}@${hostname}:${port}/${dbname}?max=20`

let container: StartedTestContainer | null = null
let pool: Pool | null = null

beforeAll(async () => {
  container = await new GenericContainer('postgres:13-alpine')
    .withExposedPorts(5432)
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

function createDatabase (options?: PoolConfig | string): PostgresqlDatabase {
  if (pool === null) {
    throw new Error('Pool is null')
  }

  const database = new PostgresqlDatabase(options)
  database.pool = pool

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
  const database = createDatabase()

  const expectedData = {
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }

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
  const database = createDatabase()

  const expectedData = [{
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }, {
    id: 2,
    name: 'name-insert',
    value: 'value-insert'
  }]

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
  const database = createDatabase(PostgresqlDatabase.parseDSN(dsn))
  const connection = await database.connect()
  expect(connection).instanceOf(PostgresqlConnection)
  connection.release()
}

async function connectWithStringOptions (): Promise<void> {
  const database = createDatabase(dsn)
  const connection = await database.connect()
  expect(connection).instanceOf(PostgresqlConnection)
  connection.release()
}

function parseADSN (): void {
  const expectedOptions = {
    connectionString: dsn,
    max: '20'
  }

  const options = PostgresqlDatabase.parseDSN(dsn)
  expect(options).eql(expectedOptions)
}

async function streamRows (finish: (error?: Error | null) => void): Promise<void> {
  const database = createDatabase()
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

  stream.on('data', (datum) => {
    data.push(datum)
  })

  stream.on('close', () => {
    try {
      expect(data).deep.members(expectedData)
      expect(database.pool.idleCount).gt(0)
      finish()
    } catch (error: unknown) {
      finish(error as Error)
    }
  })
}

async function updateOneRow (): Promise<void> {
  const database = createDatabase()

  const expectedData = {
    id: 1,
    name: 'name-update',
    value: 'value-update'
  }

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
