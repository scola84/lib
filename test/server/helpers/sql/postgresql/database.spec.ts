import mock, { restore } from 'mock-fs'
import { Pool } from 'pg'
import type { PoolConfig } from 'pg'
import { PostgresqlDatabase } from '../../../../../src/server/helpers/sql/postgresql'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('PostgresqlConnection', () => {
  describe('should', () => {
    it('create a pool with options', createAPoolWithOptions)
    it('create a pool with SSL options', createAPoolWithSslOptions)
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
  options: PoolConfig & {
    ssl: {
      ca: string
    }
  }
}

class Helpers {
  public dsn: string
  public password: string
  public pool: Pool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.dsn = 'postgres://root@127.0.0.1/scola?max=15'
  helpers.password = 'root'

  helpers.pool = new Pool({
    database: 'scola',
    password: 'root',
    user: 'root'
  })

  await helpers.pool.query(sql`CREATE TABLE test_database (
    id BIGSERIAL PRIMARY KEY,
    name varchar,
    value varchar
  )`)
})

beforeEach(async () => {
  await helpers.pool.query(sql`TRUNCATE test_database RESTART IDENTITY`)
})

afterAll(async () => {
  await helpers.pool.query(sql`DROP TABLE test_database`)
  await helpers.pool.end()
})

async function createAPoolWithOptions (): Promise<void> {
  const database = new PostgresqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  await database.start()

  const pool = database.pool as unknown as ExtendedPool

  expect(pool).instanceOf(Pool)
  expect(pool.options.max).equal(15)
}

async function createAPoolWithSslOptions (): Promise<void> {
  const database = new PostgresqlDatabase({
    dsn: `${helpers.dsn}&ssl.ca=/path/to/ca`,
    password: helpers.password
  })

  mock({
    '/path/to/ca': 'CA certificate'
  })

  await database.start()
  restore()

  const pool = database.pool as unknown as ExtendedPool

  expect(pool).instanceOf(Pool)
  expect(pool.options.ssl.ca.toString()).equal('CA certificate')
}

async function deleteOneRow (): Promise<void> {
  const database = new PostgresqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const { id } = await database.insert(sql`
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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.stop()
  }
}

async function depopulate (): Promise<void> {
  const database = new PostgresqlDatabase({
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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.stop()
  }
}

async function insertABulkOfRows (): Promise<void> {
  const database = new PostgresqlDatabase({
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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.stop()
  }
}

async function insertOneRow (): Promise<void> {
  const database = new PostgresqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.insert(sql`
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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.stop()
  }
}

async function notFailToStartAndStopWhenDsnIsUndefined (): Promise<void> {
  const database = new PostgresqlDatabase()

  await database.start()
  await database.stop()
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new PostgresqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const { id } = await database.insert(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name'
    })

    const data = await database.selectOne(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(data.id).equal(id)
  } finally {
    await database.stop()
  }
}

async function populate (): Promise<void> {
  const database = new PostgresqlDatabase({
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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.stop()
  }
}

async function query (): Promise<void> {
  const database = new PostgresqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.query({
      string: sql`
        SELECT *
        FROM test_database
      `
    })

    expect(database.pool.idleCount).gt(0)
  } finally {
    await database.stop()
  }
}

async function selectMultipleRows (): Promise<void> {
  const database = new PostgresqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    await database.selectAll(sql`
      SELECT *
      FROM test_database
    `)

    expect(database.pool.idleCount).gt(0)
  } finally {
    await database.stop()
  }
}

async function selectAndResolveUndefined (): Promise<void> {
  const database = new PostgresqlDatabase({
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

    expect(database.pool.idleCount).gt(0)
  } finally {
    await database.stop()
  }
}

async function selectOneAndRejectUndefined (): Promise<void> {
  const database = new PostgresqlDatabase({
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

    expect(database.pool.idleCount).gt(0)
  } catch (error: unknown) {
    expect(String(error)).match(/Object is undefined/u)
  } finally {
    await database.stop()
  }
}

async function startADatabaseWithAPopulation (): Promise<void> {
  const database = new PostgresqlDatabase({
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

    expect(data.id).equal(1)
  } finally {
    await database.stop()
  }
}

async function streamRows (): Promise<void> {
  const database = new PostgresqlDatabase({
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

    await new Promise<void>((resolve, reject) => {
      stream.on('data', () => {})

      stream.on('close', () => {
        try {
          expect(database.pool.totalCount).gt(0)
          expect(database.pool.idleCount).equal(database.pool.totalCount)
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
  const database = new PostgresqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const { id } = await database.insert(sql`
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
      id: id,
      name: 'name-update'
    })

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.stop()
  }
}
