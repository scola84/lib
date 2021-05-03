import { ConnectionPool } from 'mssql'
import { MssqlDatabase } from '../../../../../src/server/helpers/sql/mssql'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('PostgresqlConnection', () => {
  describe('should', () => {
    it('connect with object options', connectWithObjectOptions)
    it('connect with string options', connectWithStringOptions)
    it('connect without options', connectWithoutOptions)
    it('insert one row', insertOneRow)
    it('insert two rows', insertTwoRows)
    it('delete one row', deleteOneRow)
    it('execute a query', executeAQuery)
    it('parse a BigInt as a Number', parseABigIntAsANumber)
    it('parse a DSN', parseADSN)
    it('stream rows', streamRows)
    it('update one row', updateOneRow)
  })
})

interface PoolWithNumbers {
  available: number
  borrowed: number
  pending: number
  size: number
}

class Helpers {
  public dsn: string
  public pool: ConnectionPool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.dsn = 'mssql://sa:rootRoot1@localhost:1433/scola?parseJSON=true&pool.max=20'

  helpers.pool = new ConnectionPool({
    options: {
      enableArithAbort: true
    },
    password: 'rootRoot1',
    server: 'localhost',
    user: 'sa'
  })

  await helpers.pool.connect()
  await helpers.pool.query(sql`CREATE DATABASE scola`)
  await helpers.pool.query(sql`USE scola`)

  await helpers.pool.query(sql`CREATE TABLE test_database (
    id INT NOT NULL PRIMARY KEY IDENTITY (1, 1),
    name VARCHAR(255) NULL,
    value VARCHAR(255) NULL
  )`)
})

afterEach(async () => {
  await helpers.pool.query(sql`TRUNCATE TABLE test_database`)
})

afterAll(async () => {
  await helpers.pool.query(sql`USE master`)
  await helpers.pool.query(sql`DROP DATABASE scola`)
  await helpers.pool.close()
})

async function connectWithObjectOptions (): Promise<void> {
  const database = new MssqlDatabase(MssqlDatabase.parseDSN(helpers.dsn))

  try {
    expect(database.pool).instanceOf(ConnectionPool)
  } finally {
    await database.end()
  }
}

async function connectWithStringOptions (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)

  try {
    expect(database.pool).instanceOf(ConnectionPool)
  } finally {
    await database.end()
  }
}

async function connectWithoutOptions (): Promise<void> {
  const database = new MssqlDatabase()

  try {
    expect(database.pool).instanceOf(ConnectionPool)
  } finally {
    await database.end()
  }
}

async function deleteOneRow (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)

  try {
    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (
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

    await database.delete(sql`
      DELETE FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    const data = await database.selectOne(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    const pool = database.pool as unknown as PoolWithNumbers

    expect(data).equal(undefined)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}

async function executeAQuery (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    await database.query(sql`SELECT 1`)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}

async function insertOneRow (): Promise<void> {
  const expectedData = {
    id: 1,
    name: 'name-insert',
    value: 'value-insert'
  }

  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (
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

    const data = await database.selectOne(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).include(expectedData)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
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

  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    const [{ id }] = await database.insert(sql`
      INSERT INTO test_database (
        name,
        value
      ) VALUES $(list)
    `, {
      list: [
        ['name-insert', 'value-insert'],
        ['name-insert', 'value-insert']
      ]
    })

    expect(id).equal(2)

    const data = await database.select(sql`
      SELECT *
      FROM test_database
    `)

    expect(data).deep.members(expectedData)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)

  try {
    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (
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

    const data = await database.selectOne<{ id: number }, { id: number }>(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(data?.id).equal(id)
  } finally {
    await database.end()
  }
}

function parseADSN (): void {
  const expectedOptions = {
    database: 'scola',
    options: {
      enableArithAbort: true
    },
    parseJSON: true,
    password: 'rootRoot1',
    pool: {
      max: 20
    },
    port: 1433,
    server: 'localhost',
    user: 'sa'
  }

  const options = MssqlDatabase.parseDSN(helpers.dsn)
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

  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    await database.insert('INSERT INTO test_database (name,value) VALUES $(list)', {
      list: [
        ['name-insert', 'value-insert'],
        ['name-insert', 'value-insert']
      ]
    })

    const stream = await database.stream('SELECT * FROM test_database')

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (datum) => {
        data.push(datum)
      })

      stream.on('close', () => {
        try {
          expect(data).deep.members(expectedData)
          expect(pool.available).equal(pool.size)
          resolve()
        } catch (error: unknown) {
          reject(error)
        }
      })
    })
  } finally {
    await database.end()
  }
}

async function updateOneRow (): Promise<void> {
  const expectedData = {
    id: 1,
    name: 'name-update',
    value: 'value-update'
  }

  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (name,value) VALUES ($(name),$(value))
    `, {
      name: 'name-insert',
      value: 'value-insert'
    })

    await database.update(sql`
      UPDATE test_database
      SET
        name = $(name),
        value = $(value)
      WHERE id = $(id)
    `, {
      id,
      name: 'name-update',
      value: 'value-update'
    })

    const data = await database.selectOne(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).include(expectedData)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}
