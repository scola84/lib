import { Pool } from 'pg'
import { PostgresqlDatabase } from '../../../../../src/server/helpers/sql/postgresql'
import { expect } from 'chai'

describe('PostgresqlConnection', () => {
  describe('should', () => {
    it('parse a BigInt as a Number', parseABigIntAsANumber)
    it('parse a DSN', parseADSN)
    it('connect with object options', connectWithObjectOptions)
    it('connect with string options', connectWithStringOptions)
    it('connect without options', connectWithoutOptions)
    it('execute a query', executeAQuery)
    it('insert one row', insertOneRow)
    it('insert two rows', insertTwoRows)
    it('update one row', updateOneRow)
    it('delete one row', deleteOneRow)
    it('stream rows', streamRows)
  })
})

class Helpers {
  public dsn: string
  public pool: Pool
}

const helpers = new Helpers()

beforeAll(async () => {
  helpers.dsn = 'postgres://root:root@127.0.0.1/scola?max=20'

  helpers.pool = new Pool({
    database: 'scola',
    host: 'postgres',
    password: 'root',
    user: 'root'
  })

  await helpers.pool.query(`CREATE TABLE test_database (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR,
    value VARCHAR
  )`)
})

beforeEach(async () => {
  await helpers.pool.query('TRUNCATE test_database RESTART IDENTITY')
})

afterAll(async () => {
  await helpers.pool.query('DROP TABLE test_database')
  await helpers.pool.end()
})

async function connectWithObjectOptions (): Promise<void> {
  const database = new PostgresqlDatabase(PostgresqlDatabase.parseDSN(helpers.dsn))

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
    const { id } = await database.insertOne(`
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

    await database.delete(`
      DELETE FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    const data = await database.selectOne(`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).equal(undefined)
    expect(database.pool.idleCount).gt(0)
  } finally {
    await database.end()
  }
}

async function executeAQuery (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    await database.query(`
      SELECT 1
    `)

    expect(database.pool.idleCount).gt(0)
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

  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    const { id } = await database.insertOne(`
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

    const data = await database.selectOne(`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).include(expectedData)
    expect(database.pool.idleCount).gt(0)
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

  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    const [{ id }] = await database.insert(`
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

    expect(id).equal(1)

    const data = await database.select(`
      SELECT *
      FROM test_database
    `)

    expect(data).deep.members(expectedData)
    expect(database.pool.idleCount).gt(0)
  } finally {
    await database.end()
  }
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    const { id } = await database.insertOne(`
      INSERT INTO test_database (
        id,
        name,
        value
      ) VALUES (
        $(id),
        $(name),
        $(value)
      )
    `, {
      id: 1,
      name: 'name-insert',
      value: 'value-insert'
    })

    const data = await database.selectOne<{ id: number }, { id: number }>(`
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
    connectionString: helpers.dsn,
    max: '20'
  }

  const options = PostgresqlDatabase.parseDSN(helpers.dsn)
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

  const database = new PostgresqlDatabase(helpers.dsn)

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
          expect(database.pool.idleCount).gt(0)
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

  const database = new PostgresqlDatabase(helpers.dsn)

  try {
    const { id } = await database.insertOne(`
      INSERT INTO test_database (name,value) VALUES ($(name),$(value))
    `, {
      name: 'name-insert',
      value: 'value-insert'
    })

    await database.update(`
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

    const data = await database.selectOne(`
      SELECT *
      FROM test_database
      WHERE id = $(id)
    `, {
      id
    })

    expect(data).include(expectedData)
    expect(database.pool.idleCount).gt(0)
  } finally {
    await database.end()
  }
}
