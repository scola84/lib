import { MysqlDatabase } from '../../../../../src/server/helpers/sql/mysql'
import type { Pool } from 'mysql2/promise'
import { createPool } from 'mysql2/promise'
import { expect } from 'chai'

describe('MysqlConnection', () => {
  describe('should', () => {
    it('parse a bigint as a number', parseABigIntAsANumber)
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
  helpers.dsn = 'mysql://root:root@127.0.0.1:3306/scola?connectionLimit=20'

  helpers.pool = createPool({
    database: 'scola',
    password: 'root',
    user: 'root'
  })

  await helpers.pool.query(`CREATE TABLE test_database (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    value VARCHAR(255) NULL
  )`)
})

afterEach(async () => {
  await helpers.pool.query('TRUNCATE test_database')
})

afterAll(async () => {
  await helpers.pool.query('DROP TABLE test_database')
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

  try {
    let released = 0

    database.pool.on('release', () => {
      released += 1
    })

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
    expect(released).equal(3)
  } finally {
    await database.end()
  }
}

async function executeAQuery (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

  try {
    let released = 0

    database.pool.on('release', () => {
      released += 1
    })

    await database.query(`
      SELECT 1
    `)

    expect(released).equal(1)
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

  const database = new MysqlDatabase(helpers.dsn)

  try {
    let released = 0

    database.pool.on('release', () => {
      released += 1
    })

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
    expect(released).equal(2)
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

  const database = new MysqlDatabase(helpers.dsn)

  try {
    let released = 0

    database.pool.on('release', () => {
      released += 1
    })

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
    expect(released).equal(2)
  } finally {
    await database.end()
  }
}

async function parseABigIntAsANumber (): Promise<void> {
  const database = new MysqlDatabase(helpers.dsn)

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
    connectionLimit: '20',
    database: 'scola',
    host: '127.0.0.1',
    password: 'root',
    port: 3306,
    user: 'root'
  }

  const options = MysqlDatabase.parseDSN(helpers.dsn)
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

  const database = new MysqlDatabase(helpers.dsn)

  try {
    let released = 0

    database.pool.on('release', () => {
      released += 1
    })

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
          expect(released).equal(2)
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

  const database = new MysqlDatabase(helpers.dsn)

  try {
    let released = 0

    database.pool.on('release', () => {
      released += 1
    })

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
    expect(released).equal(3)
  } finally {
    await database.end()
  }
}
