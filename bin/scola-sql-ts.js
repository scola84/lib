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

  if (target === undefined) {
    throw new Error('error: missing required argument "target"')
  }

  const clients = {
    mysql: ['mysql', 'mysql2'],
    postgres: ['pg']
  }

  const ports = {
    mysql: 3306,
    postgres: 5432
  }

  const typeMap = {
    Buffer: ['UDT', 'binary', 'image', 'varbinary'],
    Date: ['date', 'datetime', 'datetime2', 'datetimeoffset', 'smalldatetime', 'time', 'timestamp', 'timestamptz'],
    boolean: ['bit', 'bool', 'boolean'],
    number: ['bigint', 'bigserial', 'dec', 'decimal', 'double', 'double precision', 'fixed', 'float', 'float4', 'float8', 'int', 'int4', 'int8', 'integer', 'money', 'numeric', 'real', 'serial', 'smallint', 'smallmoney', 'tinyint', 'year'],
    string: ['char', 'character varying', 'longtext', 'mediumtext', 'nchar', 'ntext', 'nvarchar', 'text', 'tinytext', 'uniqueidentifier', 'uuid', 'varbinary', 'varchar', 'xml'],
    unknown: ['TVP', 'json']
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

  url.hostname = url.hostname || '127.0.0.1'
  url.username = url.username || 'root'
  url.password = url.password || 'root'
  url.port = url.port || ports[protocol]

  sqlts
    .toObject({
      client,
      connection: String(url),
      // eslint-disable-next-line no-template-curly-in-string
      interfaceNameFormat: '${table}',
      tableNameCasing: 'pascal',
      typeMap
    })
    .then((database) => {
      database.tables = database.tables.filter((table) => {
        return url.pathname.includes('queue') || table.schema !== 'queue'
      })

      return database
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
      const entities = database.tables
        .map((table) => {
          return `  ${table.name}: Array<Partial<${table.interfaceName}>>`
        })
        .sort()
        .join('\n')

      const exports = database.tables
        .map((table) => {
          return `export * from './${table.name.replace('_', '-')}'`
        })
        .sort()
        .join('\n')

      const imports = database.tables
        .map((table) => {
          return `import type { ${table.interfaceName} } from './${table.name.replace('_', '-')}'`
        })
        .sort()
        .join('\n')

      const data = [
        imports,
        '',
        exports,
        '',
        'export interface Entities extends Record<string, Array<Partial<unknown>>> {',
        entities,
        '}'
      ].join('\n')

      fs.writeFileSync(`${target}/index.ts`, `${data.trim()}\n`)
    })
    .catch((error) => {
      logger.log(String(error))
    })
} catch (error) {
  logger.error(String(error))
}
