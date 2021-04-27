import { MysqlConnection, MysqlDatabase } from '../../../../../src/server/helpers/sql/mysql'
import { GenericContainer } from 'testcontainers'
import type { Pool } from 'mysql2/promise'
import type { PoolOptions } from 'mysql2/typings/mysql'
import type { StartedTestContainer } from 'testcontainers'
import { createPool } from 'mysql2/promise'
import { expect } from 'chai'

describe('MysqlConnection', () => {
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
const PORT = 3306
const USERNAME = 'root'

const DSN = `mysql://${USERNAME}:${PASSWORD}@${HOSTNAME}:${PORT}/${DATABASE}?connectionLimit=20`

const helpers = new Helpers()

beforeAll(async () => {
  helpers.container = await new GenericContainer('mysql:8')
    .withExposedPorts(3306)
    .withEnv('MYSQL_DATABASE', DATABASE)
    .withEnv('MYSQL_ROOT_PASSWORD', PASSWORD)
    .withTmpFs({ '/var/lib/mysql': 'rw' })
    .start()

  helpers.pool = createPool({
    database: DATABASE,
    host: helpers.container.getHost(),
    password: PASSWORD,
    port: helpers.container.getMappedPort(PORT),
    user: USERNAME
  })

  await helpers.pool.query(`CREATE TABLE test (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    value VARCHAR(255) NULL
  )`)
})

afterAll(async () => {
  await helpers.pool.end()
  await helpers.container.stop()
})

beforeEach(async () => {
  await helpers.pool.query('TRUNCATE test')
})

function createDatabase (options?: PoolOptions | string): MysqlDatabase {
  const database = new MysqlDatabase(options)
  database.pool = helpers.pool
  return database
}

async function deleteOneRow (): Promise<void> {
  const database = createDatabase()
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

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
  expect(released).equal(3)
}

async function executeAQuery (): Promise<void> {
  const database = createDatabase()
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

  await database.query(`
    SELECT 1
  `)

  expect(released).equal(1)
}

async function insertOneRow (): Promise<void> {
  const expectedData = {
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }

  let released = 0

  const database = createDatabase()

  database.pool.on('release', () => {
    released += 1
  })

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
  expect(released).equal(2)
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

  let released = 0

  const database = createDatabase()

  database.pool.on('release', () => {
    released += 1
  })

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
  expect(released).equal(2)
}

async function connectWithObjectOptions (): Promise<void> {
  const database = createDatabase(MysqlDatabase.parseDSN(DSN))
  const connection = await database.connect()

  try {
    expect(connection).instanceOf(MysqlConnection)
  } finally {
    connection.release()
  }
}

async function connectWithStringOptions (): Promise<void> {
  const database = createDatabase(DSN)
  const connection = await database.connect()

  try {
    expect(connection).instanceOf(MysqlConnection)
  } finally {
    connection.release()
  }
}

function parseADSN (): void {
  const expectedOptions = {
    connectionLimit: '20',
    database: DATABASE,
    host: HOSTNAME,
    password: PASSWORD,
    port: PORT,
    user: USERNAME
  }

  const options = MysqlDatabase.parseDSN(DSN)
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
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

  await database.insert(`
    INSERT INTO test (name,value) VALUES $(list)
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
        expect(released).equal(2)
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

  let released = 0

  const database = createDatabase()

  database.pool.on('release', () => {
    released += 1
  })

  const { id } = await database.insertOne(`
    INSERT INTO test (name,value) VALUES ($(name),$(value))
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
  expect(released).equal(3)
}
