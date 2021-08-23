import { ConnectionPool } from 'mssql'
import { MssqlDatabase } from '../../../../../src/server/helpers/sql/mssql'
import type { config } from 'mssql'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('MssqlConnection', () => {
  describe('should', () => {
    it('create a pool with options', createAPoolWithOptions)
    it('delete one row', deleteOneRow)
    it('depopulate', depopulate)
    it('insert a bulk of rows', insertABulkOfRows)
    it('insert one row', insertOneRow)
    it('not fail to start and stop when DSN is undefined', notFailToStartAndStopWhenDsnIsUndefined)
    it('parse a BigInt as a Number', parseABigIntAsANumber)
    it('populate', populate)
    it('query', query)
    it('select multiple rows', selectMultipleRows)
    it('select and resolve undefined', selectAndResolveUndefined)
    it('select one and reject undefined', selectOneAndRejectUndefined)
    it('start a database with a population', startADatabaseWithAPopulation)
    it('stream rows', streamRows)
    it('update one row', updateOneRow)
  })
})

interface ExtendedPool {
  available: number
  borrowed: number
  config: config
  pending: number
  size: number
}

class Helpers {
  public dsn: string
  public password: string
  public pool: ConnectionPool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.dsn = 'mssql://sa@localhost:1433/scola?parseJSON=true&options.encrypt=false'
  helpers.password = 'rootRoot1'

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

async function createAPoolWithOptions (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  await database.start()

  const pool = database.pool as unknown as ExtendedPool

  expect(pool).instanceof(ConnectionPool)
  expect(pool.config.parseJSON).equal(true)
}

async function deleteOneRow (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

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

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function depopulate (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.depopulate({
      test_database: [{
        id: 1,
        name: 'name'
      }]
    })

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function insertABulkOfRows (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.insertAll(sql`
      INSERT INTO test_database (name)
      VALUES $(list)
    `, {
      list: [
        ['name1'],
        ['name2']
      ]
    })

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function insertOneRow (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function notFailToStartAndStopWhenDsnIsUndefined (): Promise<void> {
  const database = new MssqlDatabase()

  await database.start()
  await database.stop()
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

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
    expect(data.id).equal(String(id))
  } finally {
    await database.stop()
  }
}

async function populate (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.populate({
      test_database: [{
        id: 1,
        name: 'name'
      }]
    })

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function query (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.query(sql`
      SELECT *
      FROM test_database
    `)

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function selectMultipleRows (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.selectAll(sql`
      SELECT *
      FROM test_database
    `)

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function selectAndResolveUndefined (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.select(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id: 1
    })

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}

async function selectOneAndRejectUndefined (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.selectOne(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id: 1
    })

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } catch (error: unknown) {
    expect(String(error)).match(/Object is undefined/u)
  } finally {
    await database.stop()
  }
}

async function startADatabaseWithAPopulation (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password,
    population: {
      test_database: [{
        id: 1,
        name: 'name'
      }]
    }
  })

  try {
    await database.start()

    const data = await database.selectOne<{ id: number }, { id: number }>(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id: 1
    })

    expect(data.id).equal('1')
  } finally {
    await database.stop()
  }
}

async function streamRows (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

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

    const pool = database.pool as unknown as ExtendedPool

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
    await database.stop()
  }
}

async function updateOneRow (): Promise<void> {
  const database = new MssqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

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

    const pool = database.pool as unknown as ExtendedPool

    expect(pool.size).gt(0)
    expect(pool.available).equal(pool.size)
  } finally {
    await database.stop()
  }
}
