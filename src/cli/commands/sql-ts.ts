import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import { URL } from 'url'
import sqlts from '@rmp135/sql-ts'

interface Options {
  exclude?: string[]
  include?: string[]
  silent: boolean
}

type Dialects = 'mssql' | 'mysql' | 'pgsql'

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates TypeScript interfaces from a SQL database.

  Reads all tables from the database at <source>. Creates an interface for 
  every table with the sorted column names as property names and the column
  types as property types. Makes all properties non-optional. Writes every
  interface to a file named "{table}.ts" in <target>.

  Creates import/export statements for every interface. Creates an interface
  called Entities, containing a named list of entity arrays. Writes the
  statements and the Entities interface to "index.ts" in <target>.

  See https://www.npmjs.com/package/@rmp135/sql-ts for more information about
  the mapping between column types and property types.

  See https://www.npmjs.com/package/@scola/lib for more information about
  using the Entities interface.

Example:
  $ scola sql-ts pgsql://root:root@localhost/queue src/server/entities/base
`)

program
  .argument('<source>', 'the Data Source Name (DSN) of the database')
  .argument('<target>', 'the directory to write the interfaces to')
  .option('-e, --exclude <exclude...>', 'a list of tables')
  .option('-i, --include <include...>', 'a list of tables')
  .option('-s, --silent', 'whether not to log')
  .parse()

try {
  const clients = {
    mssql: ['mssql'],
    mysql: ['mysql', 'mysql2'],
    pgsql: ['pg']
  }

  const ports = {
    mssql: 1433,
    mysql: 3306,
    pgsql: 5432
  }

  const typeMap = {
    Buffer: ['UDT', 'binary', 'image', 'varbinary'],
    Date: ['date', 'datetime', 'datetime2', 'datetimeoffset', 'smalldatetime', 'time', 'timestamp', 'timestamptz'],
    boolean: ['bit', 'bool', 'boolean'],
    number: ['dec', 'decimal', 'double', 'double precision', 'fixed', 'float', 'float4', 'float8', 'int', 'int4', 'int8', 'integer', 'money', 'numeric', 'real', 'serial', 'smallint', 'smallmoney', 'tinyint', 'year'],
    string: ['bigint', 'bigserial', 'char', 'character varying', 'longtext', 'mediumtext', 'nchar', 'ntext', 'nvarchar', 'text', 'tinytext', 'uniqueidentifier', 'uuid', 'varbinary', 'varchar', 'xml'],
    unknown: ['TVP', 'json']
  }

  const [
    source,
    target
  ] = program.args

  const options = program.opts<Options>()

  if (options.silent) {
    logger.error = () => {}
    logger.log = () => {}
  }

  const url = new URL(source)
  const dialect = url.protocol.slice(0, -1) as Dialects

  const client = (clients[dialect]).find((module) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require(module)
      return true
    } catch (error: unknown) {
      return false
    }
  })

  if (typeof url.hostname !== 'string') {
    url.hostname = '127.0.0.1'
  }

  if (typeof url.password !== 'string') {
    url.password = 'root'
  }

  if (typeof url.port !== 'string') {
    url.port = ports[dialect].toString()
  }

  if (typeof url.username !== 'string') {
    url.username = 'root'
  }

  if (client === undefined) {
    throw new Error(`Client for dialect "${dialect}" is undefined`)
  }

  mkdirSync(target, {
    recursive: true
  })

  sqlts
    .toObject({
      client: client,
      connection: url.toString(),
      // eslint-disable-next-line no-template-curly-in-string
      interfaceNameFormat: '${table}',
      tableNameCasing: 'pascal',
      typeMap: typeMap
    })
    .then((database) => {
      database.tables = database.tables.filter((table) => {
        return (
          options.exclude !== undefined &&
          !options.exclude.includes(table.name)
        ) || (
          options.include?.includes(table.name) === true
        )
      })

      return database
    })
    .then((database) => {
      database.tables.forEach((table) => {
        table.columns.forEach((column) => {
          column.optional = false
        })
      })

      return database
    })
    .then((database) => {
      database.tables.forEach((table) => {
        table.columns.sort((left, right) => {
          if (left.propertyName > right.propertyName) {
            return 1
          }

          return -1
        })
      })

      return database
    })
    .then((database) => {
      database.tables.forEach((table) => {
        writeFileSync(
          `${target}/${table.name.replace(/_/gu, '-')}.ts`,
          sqlts
            .fromObject({
              enums: [],
              tables: [table]
            }, {})
            .replace(/\/\*[\s\S]*\*\/\n*/gu, '')
            .replace(/["';]/gu, '')
            .replace(/&lt;/gu, '<')
            .replace(/&gt;/gu, '>')
            .replace(/\s\n/gu, '\n')
        )

        logger.log(`Created ${target}/${table.name.replace(/_/gu, '-')}.ts`)
      })

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
          return `export * from './${table.name.replace(/_/gu, '-')}'`
        })
        .sort()
        .join('\n')

      const imports = database.tables
        .map((table) => {
          return `import type { ${table.interfaceName} } from './${table.name.replace(/_/gu, '-')}'`
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

      writeFileSync(`${target}/index.ts`, `${data.trim()}\n`)
      logger.log(`Created ${target}/index.ts`)
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
      process.exit(1)
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
  process.exit(1)
}
