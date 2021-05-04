import { MysqlDatabase } from '../../../../../src/server/helpers/sql/mysql'
import type { Pool } from 'mysql2/promise'
import { createPool } from 'mysql2/promise'
import type denque from 'denque'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('MysqlConnection', () => {
  describe('should', () => {
    it('connect with object options', connectWithObjectOptions)
    it('connect with string options', connectWithStringOptions)
    it('connect without options', connectWithoutOptions)
    it('delete one row', deleteOneRow)
    it('execute a query', executeAQuery)
    it('insert a bulk of rows', insertABulkOfRows)
    it('insert one row', insertOneRow)
    it('parse a BigInt as a Number', parseABigIntAsANumber)
    it('parse a DSN', parseADSN)
    it('stream rows', streamRows)
    it('update one row', updateOneRow)
  })
})

interface PoolWithNumbers {
  pool: {
    _allConnections: denque
    _freeConnections: denque
  }
}

class Helpers {
  public dsn: string
  public pool: Pool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.dsn = 'mysql://root:root@127.0.0.1:3306/scola?connectionLimit=20&supportBigNumbers=true'

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

async function connectWithObjectOptions (): Promise<void> {
  const database = new MysqlDatabase(MysqlDatabase.parseDSN(helpers.dsn))

  try {
    expect(database.pool.constructor.name).equal('PromisePool')
  } finally {
    await database.end()
  }
}

async function connectWithStringOptions (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

  try {
    expect(database.pool.constructor.name).equal('PromisePool')
  } finally {
    await database.end()
  }
}

async function connectWithoutOptions (): Promise<void> {
  const database = new MysqlDatabase()

  try {
    expect(database.pool.constructor.name).equal('PromisePool')
  } finally {
    await database.end()
  }
}

async function deleteOneRow (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

  const {
    pool: {
      _allConnections: all,
      _freeConnections: free
    }
  } = database.pool as unknown as PoolWithNumbers

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

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.end()
  }
}

async function executeAQuery (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

  const {
    pool: {
      _allConnections: all,
      _freeConnections: free
    }
  } = database.pool as unknown as PoolWithNumbers

  try {
    await database.query(sql`SELECT 1`)
    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.end()
  }
}

async function insertABulkOfRows (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

  const {
    pool: {
      _allConnections: all,
      _freeConnections: free
    }
  } = database.pool as unknown as PoolWithNumbers

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

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.end()
  }
}

async function insertOneRow (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

  const {
    pool: {
      _allConnections: all,
      _freeConnections: free
    }
  } = database.pool as unknown as PoolWithNumbers

  try {
    await database.insertOne(sql`
      INSERT INTO test_database (name)
      VALUES ($(name))
    `, {
      name: 'name-insert'
    })

    expect(all.length).gt(0)
    expect(free.length).equal(all.length)
  } finally {
    await database.end()
  }
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

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

    expect(data?.id).equal(id)
  } finally {
    await database.end()
  }
}

function parseADSN (): void {
  const expectedOptions = {
    connectionLimit: 20,
    database: 'scola',
    host: '127.0.0.1',
    password: 'root',
    port: 3306,
    supportBigNumbers: true,
    user: 'root'
  }

  const options = MysqlDatabase.parseDSN(helpers.dsn)
  expect(options).eql(expectedOptions)
}

async function streamRows (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

  const {
    pool: {
      _allConnections: all,
      _freeConnections: free
    }
  } = database.pool as unknown as PoolWithNumbers

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
          expect(all.length).gt(0)
          expect(free.length).equal(all.length)
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
  const database = new MysqlDatabase(helpers.dsn)

  const {
    pool: {
      _allConnections: all,
      _freeConnections: free
    }
  } = database.pool as unknown as PoolWithNumbers

  try {
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
    await database.end()
  }
}