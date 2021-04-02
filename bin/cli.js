#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const sqlts = require('@rmp135/sql-ts')

const command = process.argv[2]

if (command === 'sql-ts') {
  const options = process.argv
    .slice(3)
    .reduce((result, value, index) => {
      return value.startsWith('-') ? {
        ...result,
        [value.slice(2)]: process.argv[index + 4]
      } : result
    }, {
      driver: '',
      dsn: '',
      path: ''
    })

  if (options.driver === '') {
    console.log('scola: provide a driver with --driver (see http://knexjs.org/#Installation-node)')
    process.exit()
  }

  if (options.dsn === '') {
    console.log('scola: provide a source DSN with --dsn')
    process.exit()
  }

  if (options.path === '') {
    console.log('scola: provide a target directory with --path')
    process.exit()
  }

  options.path = `${path.resolve(options.path)}/`

  const typeMap = {
    Buffer: ['binary', 'varbinary', 'image', 'UDT'],
    Date: ['datetime', 'timestamp', 'date', 'time', 'timestamp', 'datetime2', 'smalldatetime', 'datetimeoffset'],
    Object: ['json', 'TVP'],
    boolean: ['bit', 'boolean', 'bool'],
    number: ['tinyint', 'int', 'numeric', 'integer', 'real', 'smallint', 'decimal', 'float', 'float4', 'float8', 'double precision', 'double', 'dec', 'fixed', 'year', 'serial', 'bigserial', 'int4', 'money', 'smallmoney'],
    string: ['nchar', 'nvarchar', 'varchar', 'char', 'tinytext', 'text', 'longtext', 'mediumtext', 'ntext', 'varbinary', 'uuid', 'uniqueidentifier', 'character varying', 'bigint', 'xml']
  }

  sqlts
    .toObject({
      client: options.driver,
      connection: options.dsn,
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
      fs.mkdirSync(options.path, { recursive: true })
      return database
    })
    .then((database) => {
      for (const table of database.tables) {
        table.columns.sort((a, b) => {
          return a.propertyName > b.propertyName ? 1 : -1
        })
      }

      return database
    })
    .then((database) => {
      for (const table of database.tables) {
        fs.writeFileSync(
          `${options.path}${table.name.replace('_', '-')}.ts`,
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

      fs.writeFileSync(
        `${options.path}index.ts`,
        `${exports}\n`
      )
    })
    .catch((error) => {
      console.error(error)
    })
} else {
  console.log(`scola: '${command}' is not scola command.`)
}
