import { Pool } from 'pg'
import { PostgresqlDatabase } from '../../../../../src/server/helpers/sql/postgresql'
import { expect } from 'chai'
import { sql } from '../../../../../src/server/helpers/sql/tag'

describe('PostgresqlConnection', () => {
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

class Helpers {
  public dsn: string
  public pool: Pool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.dsn = 'postgres://root:root@127.0.0.1/scola'

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

async function connectWithObjectOptions (): Promise<void> {
  const database = new PostgresqlDatabase(PostgresqlDatabase.parseDsn(helpers.dsn))

  try {
    expect(database.pool).instanceOf(Pool)
  } finally {
    await database.end()
  }
}

async function connectWithStringOptions (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    expect(database.pool).instanceOf(Pool)
  } finally {
    await database.end()
  }
}

async function connectWithoutOptions (): Promise<void> {
  const database = new PostgresqlDatabase()

  try {
    expect(database.pool).instanceOf(Pool)
  } finally {
    await database.end()
  }
}

async function deleteOneRow (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.end()
  }
}

async function executeAQuery (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    await database.query(sql`SELECT 1`)
    expect(database.pool.idleCount).gt(0)
  } finally {
    await database.end()
  }
}

async function insertABulkOfRows (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.end()
  }
}

async function insertOneRow (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    await database.insertOne(sql`
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
    await database.end()
  }
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

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

function parseADsn (): void {
  const dsn = `${helpers.dsn}?keepAlive=true&max=20&sslmode=require`

  const expectedOptions = {
    connectionString: dsn,
    keepAlive: true,
    max: 20,
    sslmode: 'require'
  }

  const options = PostgresqlDatabase.parseDsn(dsn)
  expect(options).eql(expectedOptions)
}

async function streamRows (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

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
          expect(database.pool.totalCount).gt(0)
          expect(database.pool.idleCount).equal(database.pool.totalCount)
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
  const database = new PostgresqlDatabase(helpers.dsn)

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

    expect(database.pool.totalCount).gt(0)
    expect(database.pool.idleCount).equal(database.pool.totalCount)
  } finally {
    await database.end()
  }
}
