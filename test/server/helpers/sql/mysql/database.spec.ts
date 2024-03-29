import type { ConnectionOptions, Pool } from 'mysql2/promise'
import mock, { restore } from 'mock-fs'
import { MysqlDatabase } from '../../../../../src/server/helpers/sql/mysql'
import { createPool } from 'mysql2/promise'
import type denque from 'denque'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('MysqlConnection', () => {
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
  pool: {
    config: ConnectionOptions & {
      connectionConfig: {
        ssl: {
          ca: string
        }
      }
    }
    _allConnections: denque
    _freeConnections: denque
  }
}

class Helpers {
  public dsn: string
  public password: string
  public pool: Pool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.dsn = 'mysql://root@127.0.0.1:3306/scola?connectionLimit=15'
  helpers.password = 'root'

  helpers.pool = createPool({
    database: 'scola',
    password: 'root',
    user: 'root'
  })

  await helpers.pool.query(sql`CREATE TABLE test_database (
    id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name varchar(255) NULL,
    value varchar(255) NULL
  )`)
})

afterEach(async () => {
  await helpers.pool.query(sql`TRUNCATE test_database`)
})

afterAll(async () => {
  await helpers.pool.query(sql`DROP TABLE test_database`)
  await helpers.pool.end()
})

async function createAPoolWithOptions (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  await database.start()

  const pool = database.pool as unknown as ExtendedPool

  expect(pool.pool.constructor.name).equal('Pool')
  expect(pool.pool.config.connectionLimit).equal(15)
}

async function createAPoolWithSslOptions (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: `${helpers.dsn}&ssl.ca=/path/to/ca`,
    password: helpers.password
  })

  mock({
    '/path/to/ca': 'CA certificate'
  })

  await database.start()
  restore()

  const pool = database.pool as unknown as ExtendedPool

  expect(pool.pool.constructor.name).equal('Pool')
  expect(pool.pool.config.connectionConfig.ssl.ca.toString()).equal('CA certificate')
}

async function deleteOneRow (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

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

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function depopulate (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.depopulate({
      test_database: [{
        id: 1,
        name: 'name'
      }]
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function insertABulkOfRows (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.insertAll(sql`
      INSERT INTO test_database (name)
      VALUES $(list)
    `, {
      list: [
        ['name1'],
        ['name2']
      ]
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function insertOneRow (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name-insert'
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function notFailToStartAndStopWhenDsnIsUndefined (): Promise<void> {
  const database = new MysqlDatabase()

  await database.start()
  await database.stop()
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new MysqlDatabase({
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

    expect(data.id).equal(id)
  } finally {
    await database.stop()
  }
}

async function populate (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.populate({
      test_database: [{
        id: 1,
        name: 'name'
      }]
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function query (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.query(sql`
      SELECT *
      FROM test_database
    `)

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function selectMultipleRows (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.selectAll(sql`
      SELECT *
      FROM test_database
    `)

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function selectAndResolveUndefined (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.select(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id: 1
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}

async function selectOneAndRejectUndefined (): Promise<void> {
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    await database.selectOne(sql`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id: 1
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } catch (error: unknown) {
    expect(String(error)).match(/Object is undefined/u)
  } finally {
    await database.stop()
  }
}

async function startADatabaseWithAPopulation (): Promise<void> {
  const database = new MysqlDatabase({
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
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

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
          expect(all.length).gt(0)
          expect(free.length).equal(all.length)
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
  const database = new MysqlDatabase({
    dsn: helpers.dsn,
    password: helpers.password
  })

  try {
    await database.start()

    const {
      pool: {
        _allConnections: all,
        _freeConnections: free
      }
    } = database.pool as unknown as ExtendedPool

    const { id } = await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name-insert'
    })

    await database.update(sql`
      UPDATE test_database
      SET name = $(name)
      WHERE id = $(id)
    `, {
      id,
      name: 'name-update'
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.stop()
  }
}
