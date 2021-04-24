import { GenericContainer } from 'testcontainers'
import { MysqlConnection } from '../../../../../src/server/helpers/sql/mysql'
import type { Pool } from 'mysql2/promise'
import type { StartedTestContainer } from 'testcontainers'
import { createPool as createMysqlPool } from 'mysql2/promise'
import { expect } from 'chai'

describe('MysqlConnection', () => {
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
const port = 3306

let container: StartedTestContainer | null = null
let pool: Pool | null = null

beforeAll(async () => {
  container = await new GenericContainer('mysql:8')
    .withExposedPorts(port)
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

async function createConnection (): Promise<MysqlConnection> {
  if (pool === null) {
    throw new Error('Pool is null')
  }

  return new MysqlConnection(await pool.getConnection())
}

async function deleteOneRow (): Promise<void> {
  const connection = await createConnection()

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

  const { count } = await connection.delete(`
    DELETE FROM test
    WHERE id = $(id)
  `, {
    id
  })

  expect(count).equal(1)

  const data = await connection.selectOne(`
    SELECT *
    FROM test
    WHERE id = $(id)
  `, {
    id
  })

  expect(data).equal(undefined)
}

async function insertOneRow (): Promise<void> {
  const connection = await createConnection()

  const expectedData = {
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }

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
}

async function insertTwoRows (): Promise<void> {
  const connection = await createConnection()

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
}

async function releaseConnection (finish: (error?: Error | null) => void): Promise<void> {
  const connection = await createConnection()

  pool?.once('release', (releasedConnection: MysqlConnection['connection']) => {
    try {
      expect(releasedConnection.threadId).equal(connection.connection.threadId)
      finish()
    } catch (error: unknown) {
      finish(error as Error)
    }
  })

  connection.release()
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
      test1 = ? AND
      test2 = ? AND
      test3 = ? AND
      test4 = ?
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

  const [query, values] = connection.transform(rawQuery, rawValues)

  expect(query).equal(expectedQuery)
  expect(values).deep.equal(expectedValues)
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
  }
}

async function updateOneRow (): Promise<void> {
  const connection = await createConnection()

  const expectedData = {
    id: 1,
    name: 'name-update',
    value: 'value-update'
  }

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

  const { count } = await connection.update(`
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

  expect(count).equal(1)

  const data = await connection.selectOne(`
    SELECT *
    FROM test
    WHERE id = $(id)
  `, {
    id
  })

  expect(data).include(expectedData)
}
