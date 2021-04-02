#!/usr/bin/env node
/* eslint-disable no-console */

const commander = require('commander')
const fs = require('fs')
const sqlts = require('@rmp135/sql-ts')

commander
  .command('sql-ts <source-db> <target-path>')
  .description('Transforms SQL tables into TS entities')
  .option('-d, --driver <driver>', 'the database driver, see http://knexjs.org/#Installation-node', 'mysql2')
  .action((source, target, options) => {
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
        fs.mkdirSync(target, { recursive: true })
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
        console.log(String(error))
      })
  })

commander.parse()
