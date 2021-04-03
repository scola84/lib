#!/usr/bin/env node

const child = require('child_process')
const commander = require('commander')
const fs = require('fs')
const path = require('path')
const sqlts = require('@rmp135/sql-ts')
const { URL } = require('url')

const logger = console

commander
  .command('sql-clean')
  .description('Cleans up data and diff dumps')
  .action(() => {
    const protocols = [
      'mysql',
      'postgres'
    ]

    for (const protocol of protocols) {
      child.execSync(`rm -rf .deploy/${protocol}/initdb.d/data`)
      child.execSync(`rm -rf .deploy/${protocol}/initdb.d/diff`)
    }
  })

commander
  .command('sql-data <container> <source-db> [target-path]')
  .description('Dumps the data of a containerized SQL database')
  .option('-e, --exclude <exclude...>', 'a list of tables')
  .option('-i, --include <include...>', 'a list of tables')
  .action((container, source, target, options) => {
    const url = new URL(source)
    const database = url.pathname.slice(1)
    const protocol = url.protocol.slice(0, -1)

    const targetFile = target === undefined
      ? `.deploy/${protocol}/initdb.d/data/${database}.sql`
      : target

    fs.mkdirSync(path.dirname(targetFile), { recursive: true })

    if (protocol === 'mysql') {
      const exclude = (options.exclude ?? [])
        .map((table) => {
          return `--ignore-table ${database}.${table}`
        })
        .join(' ')
      const include = (options.include ?? []).join(' ')

      child.execSync([
        `docker exec ${container} mysqldump`,
        '--compact',
        exclude,
        `--host ${url.host}`,
        '--no-create-info',
        url.password ? `--password=${url.password}` : '',
        url.port ? `--port ${url.port}` : '',
        url.username ? `--user ${url.username}` : '',
        database,
        include,
        `> ${targetFile}`
      ].join(' '), {
        stdio: 'inherit'
      })
    }

    if (protocol === 'postgres') {
      const exclude = (options.exclude ?? [])
        .map((table) => {
          return `--exclude-table ${table}`
        })
        .join(' ')

      const include = (options.include ?? [])
        .map((table) => {
          return `--table ${table}`
        })
        .join(' ')

      child.execSync([
        `docker exec ${container} pg_dump`,
        '--column-inserts',
        '--data-only',
        exclude,
        '--format p',
        `--host ${url.host}`,
        include,
        url.port ? `--port ${url.port}` : '',
        '--rows-per-insert 99',
        url.username ? `--user ${url.username}` : '',
        database,
        `> ${targetFile}`
      ].join(' '), {
        stdio: 'inherit'
      })
    }
  })

commander
  .command('sql-diff <source-db> [target-path]')
  .description('Dumps the diff between a database and a schema dump')
  .action((source, target) => {
    const url = new URL(source)
    const database = url.pathname.slice(1)
    const protocol = url.protocol.slice(0, -1)

    const targetFile = target === undefined
      ? `.deploy/${protocol}/initdb.d/diff/${database}.sql`
      : target

    fs.mkdirSync(path.dirname(targetFile), { recursive: true })

    child.execSync([
      `cat .deploy/mysql/initdb.d/schema/${database}.sql`,
      '| sed "s/USE/-- USE/g" ',
      '> /tmp/scola-diff.sql'
    ].join(' '))

    child.execSync([
      'mysql-schema-diff',
      `--host ${url.hostname}`,
      '--no-old-defs',
      url.password ? `--password=${url.password}` : '',
      url.port ? `--port ${url.port}` : '',
      url.username ? `--user ${url.username}` : '',
      `db:${database}`,
      '/tmp/scola-diff.sql',
      `> ${targetFile}`
    ].join(' '))

    child.execSync('rm /tmp/scola-diff.sql')
  })

commander
  .command('sql-schema <container> <source-db> [target-path]')
  .description('Dumps the schema of a containerized SQL database')
  .option('-e, --exclude <exclude...>', 'a list of tables')
  .option('-i, --include <include...>', 'a list of tables')
  .action((container, source, target, options) => {
    const url = new URL(source)
    const database = url.pathname.slice(1)
    const protocol = url.protocol.slice(0, -1)

    const targetFile = target === undefined
      ? `.deploy/${protocol}/initdb.d/schema/${database}.sql`
      : target

    fs.mkdirSync(path.dirname(targetFile), { recursive: true })

    if (protocol === 'mysql') {
      const exclude = (options.exclude ?? [])
        .map((table) => {
          return `--ignore-table ${database}.${table}`
        })
        .join(' ')

      child.execSync([
        `docker exec ${container} mysqldump`,
        '--compact',
        exclude,
        `--host ${url.host}`,
        '--no-data',
        url.password ? `--password=${url.password}` : '',
        url.port ? `--port ${url.port}` : '',
        url.username ? `--user ${url.username}` : '',
        `--databases ${database}`,
        `> ${targetFile}`
      ].join(' '), {
        stdio: 'inherit'
      })
    }

    if (protocol === 'postgres') {
      const exclude = (options.exclude ?? [])
        .map((table) => {
          return `--exclude-table ${table}`
        })
        .join(' ')

      const include = (options.include ?? [])
        .map((table) => {
          return `--table ${table}`
        })
        .join(' ')

      child.execSync([
        `docker exec ${container} pg_dump`,
        exclude,
        '--format p',
        `--host ${url.host}`,
        include,
        '--no-owner',
        url.port ? `--port ${url.port}` : '',
        '--schema-only',
        url.username ? `--user ${url.username}` : '',
        database,
        `> ${targetFile}`
      ].join(' '), {
        stdio: 'inherit'
      })
    }
  })

commander
  .command('sql-ts <source-db> <target-path>')
  .description('Generate TS types from SQL tables')
  .action((source, target) => {
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
        logger.log(String(error))
      })
  })

try {
  commander.parse()
} catch (error) {
  logger.log(String(error))
}
