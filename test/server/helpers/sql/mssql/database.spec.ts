import { ConnectionPool } from 'mssql'
import { MssqlDatabase } from '../../../../../src/server/helpers/sql/mssql'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('MssqlConnection', () => {
  describe('should', () => {
    it('connect with object options', connectWithObjectOptions)
    it('connect with string options', connectWithStringOptions)
    it('connect without options', connectWithoutOptions)
    it('delete one row', deleteOneRow)
    it('execute a query', executeAQuery)
    it('insert a bulk of rows', insertABulkOfRows)
    it('insert one row', insertOneRow)
    it('parse a BigInt as a Number', parseABigIntAsANumber)
    it('parse a DSN', parseADsn)
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
  helpers.dsn = 'mssql://sa:rootRoot1@localhost:1433/scola'

  helpers.pool = new ConnectionPool({
    options: {
      enableArithAbort: true,
      encrypt: false
    },
    password: 'rootRoot1',
    server: 'localhost',
    user: 'sa'
  })

  await helpers.pool.connect()
  await helpers.pool.query(sql`CREATE DATABASE scola`)
  await helpers.pool.query(sql`USE scola`)

  await helpers.pool.query(sql`CREATE TABLE test_database (
    id bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    name varchar(255) NULL,
    value varchar(255) NULL
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
  const database = new MssqlDatabase(MssqlDatabase.parseDsn(helpers.dsn))

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
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    await database.delete(sql`
      DELETE FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(pool.size).gt(0)
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
    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}

async function insertABulkOfRows (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    await database.insert(sql`
      INSERT INTO test_database (name)
      VALUES $(list)
    `, {
      list: [
        ['name1'],
        ['name2']
      ]
    })

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}

async function insertOneRow (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)

  try {
    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    const data = await database.selectOne<{ id: number }, { id: number }>(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    // https://github.com/tediousjs/tedious/issues/678
    expect(data?.id).equal(String(id))
  } finally {
    await database.end()
  }
}

function parseADsn (): void {
  const dsn = `${helpers.dsn}?domain=scola&parseJSON=true&pool.max=20`

  const expectedOptions = {
    database: 'scola',
    domain: 'scola',
    options: {
      encrypt: false
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

  const options = MssqlDatabase.parseDsn(dsn)
  expect(options).eql(expectedOptions)
}

async function streamRows (): Promise<void> {
  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    await database.insert(`
      INSERT INTO test_database (name)
      VALUES $(list)
    `, {
      list: [
        ['name1'],
        ['name2']
      ]
    })

    const stream = await database.stream(`
      SELECT *
      FROM test_database
    `)

    await new Promise<void>((resolve, reject) => {
      stream.on('data', () => {})

      stream.on('close', () => {
        try {
          expect(pool.size).gt(0)
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
  const database = new MssqlDatabase(helpers.dsn)
  const pool = database.pool as unknown as PoolWithNumbers

  try {
    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    await database.update(sql`
      UPDATE test_database
      SET name = $(name)
      WHERE id = $(id)
    `, {
      id,
      name: 'name-update'
    })

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.end()
  }
}
