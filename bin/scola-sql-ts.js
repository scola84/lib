const { Command } = require('commander')
const { URL } = require('url')
const fs = require('fs')
const sqlts = require('@rmp135/sql-ts')

const logger = console
const program = new Command()

program.parse()

try {
  const [
    source,
    target
  ] = program.args

  if (source === undefined) {
    throw new Error('error: missing required argument "source"')
  }

  const clients = {
    mysql: ['mysql', 'mysql2'],
    postgres: ['pg']
  }

  const typeMap = {
    Buffer: ['binary', 'varbinary', 'image', 'UDT'],
    Date: ['datetime', 'timestamp', 'date', 'time', 'timestamp', 'datetime2', 'smalldatetime', 'datetimeoffset'],
    Object: ['json', 'TVP'],
    boolean: ['bit', 'boolean', 'bool'],
    number: ['tinyint', 'int', 'numeric', 'integer', 'real', 'smallint', 'decimal', 'float', 'float4', 'float8', 'double precision', 'double', 'dec', 'fixed', 'year', 'serial', 'bigserial', 'int4', 'money', 'smallmoney'],
    string: ['nchar', 'nvarchar', 'varchar', 'char', 'tinytext', 'text', 'longtext', 'mediumtext', 'ntext', 'varbinary', 'uuid', 'uniqueidentifier', 'character varying', 'bigint', 'xml']
  }

  const url = new URL(source)
  const protocol = url.protocol.slice(0, -1)

  const client = (clients[protocol] ?? []).find((module) => {
    try {
      require(module)
      return true
    } catch (error) {
      return false
    }
  })

  if (client === undefined) {
    throw new Error(`Client for protocol "${protocol}" is undefined`)
  }

  fs.mkdirSync(target, { recursive: true })

  sqlts
    .toObject({
      client,
      connection: source,
      // eslint-disable-next-line no-template-curly-in-string
      interfaceNameFormat: '${table}',
      tableNameCasing: 'pascal',
      typeMap: {
        Date: [...typeMap.Date, 'timestamptz'],
        number: [...typeMap.number, 'int8'],
        unknown: ['json']
      }
    })
    .then((database) => {
      for (const table of database.tables) {
        table.columns.sort((left, right) => {
          return left.propertyName > right.propertyName ? 1 : -1
        })
      }

      return database
    })
    .then((database) => {
      for (const table of database.tables) {
        fs.writeFileSync(
            `${target}/${table.name.replace('_', '-')}.ts`,
            sqlts
              .fromObject({
                enums: [],
                tables: [table]
              }, {})
              .replace(/\/\*[\s\S]*\*\/\n*/gu, '')
              .replace(/"/gu, '')
              .replace(/&lt;/gu, '<')
              .replace(/&gt;/gu, '>')
              .replace(/\s\n/gu, '\n')
        )
      }
      return database
    })
    .then((database) => {
      const exports = database.tables
        .map((table) => {
          return `export * from './${table.name.replace('_', '-')}'`
        })
        .sort()
        .join('\n')

      fs.writeFileSync(`${target}/index.ts`, `${exports}\n`)
    })
    .catch((error) => {
      logger.log(String(error))
    })
} catch (error) {
  logger.error(String(error))
}
