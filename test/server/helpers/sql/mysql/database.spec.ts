import { MysqlConnection, MysqlDatabase } from '../../../../../src/server/helpers/sql/mysql'
import { GenericContainer } from 'testcontainers'
import type { Pool } from 'mysql2/promise'
import type { PoolOptions } from 'mysql2/typings/mysql'
import type { StartedTestContainer } from 'testcontainers'
import { createPool as createMysqlPool } from 'mysql2/promise'
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

const dbname = 'scola'
const hostname = '127.0.0.1'
const username = 'root'
const password = 'password'
const port = 3306
const dsn = `mysql://${username}:${password}@${hostname}:${port}/${dbname}?connectionLimit=20`

let container: StartedTestContainer | null = null
let pool: Pool | null = null

beforeAll(async () => {
  container = await new GenericContainer('mysql:8')
    .withExposedPorts(3306)
    .withEnv('MYSQL_DATABASE', dbname)
    .withEnv('MYSQL_ROOT_PASSWORD', password)
    .withTmpFs({ '/var/lib/mysql': 'rw' })
    .start()

  pool = createMysqlPool({
    database: dbname,
    host: container.getHost(),
    password,
    port: container.getMappedPort(port),
    user: username
  })

  await pool.query(`CREATE TABLE test (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    value VARCHAR(255) NULL
  )`)
})

afterAll(async () => {
  await pool?.end()
  await container?.stop()
})

beforeEach(async () => {
  await pool?.query('TRUNCATE test')
})

function createDatabase (options?: PoolOptions | string): MysqlDatabase {
  if (pool === null) {
    throw new Error('Pool is null')
  }

  const database = new MysqlDatabase(options)
  database.pool = pool

  return database
}

async function deleteOneRow (): Promise<void> {
  const database = createDatabase()
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

  const { id } = await database.insertOne(`
    INSERT INTO scola.test (
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
    DELETE FROM scola.test
    WHERE id = $(id)
  `, {
    id
  })

  const data = await database.selectOne(`
    SELECT *
    FROM scola.test
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
  const database = createDatabase()
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

  const expectedData = {
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }

  const { id } = await database.insertOne(`
    INSERT INTO scola.test (
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
    FROM scola.test
    WHERE id = $(id)
  `, {
    id
  })

  expect(data).include(expectedData)
  expect(released).equal(2)
}

async function insertTwoRows (): Promise<void> {
  const database = createDatabase()
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

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
    INSERT INTO scola.test (
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
    FROM scola.test
  `)

  expect(data).deep.members(expectedData)
  expect(released).equal(2)
}

async function connectWithObjectOptions (): Promise<void> {
  const database = createDatabase(MysqlDatabase.parseDSN(dsn))
  const connection = await database.connect()
  expect(connection).instanceOf(MysqlConnection)
  connection.release()
}

async function connectWithStringOptions (): Promise<void> {
  const database = createDatabase(dsn)
  const connection = await database.connect()
  expect(connection).instanceOf(MysqlConnection)
  connection.release()
}

function parseADSN (): void {
  const expectedOptions = {
    connectionLimit: '20',
    database: dbname,
    host: hostname,
    password,
    port,
    user: username
  }

  const options = MysqlDatabase.parseDSN(dsn)
  expect(options).eql(expectedOptions)
}

async function streamRows (finish: (error?: Error | null) => void): Promise<void> {
  const database = createDatabase()
  const data: unknown[] = []
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

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
    INSERT INTO scola.test (
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
    FROM scola.test
  `)

  stream.on('data', (datum) => {
    data.push(datum)
  })

  stream.on('close', () => {
    try {
      expect(data).deep.members(expectedData)
      expect(released).equal(2)
      finish()
    } catch (error: unknown) {
      finish(error as Error)
    }
  })
}

async function updateOneRow (): Promise<void> {
  const database = createDatabase()
  let released = 0

  database.pool.on('release', () => {
    released += 1
  })

  const expectedData = {
    id: 1,
    name: 'name-update',
    value: 'value-update'
  }

  const { id } = await database.insertOne(`
    INSERT INTO scola.test (
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
    UPDATE scola.test
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
    FROM scola.test
    WHERE id = $(id)
  `, {
    id
  })

  expect(data).include(expectedData)
  expect(released).equal(3)
}
