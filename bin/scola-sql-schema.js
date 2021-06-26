const { Command } = require('commander')
const { URL } = require('url')
const child = require('child_process')
const fs = require('fs')
const path = require('path')
const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Dumps the schema of a SQL database.

  Extracts the context (app or lib) from <container>. Runs the
  dialect-specific dump utility on <container> to extract the schema
  of <source> and writes it to [target].

  Currently only PostgreSQL and MySQL are supported.

Example:
  $ scola sql-schema lib_mysql_1 mysql://root:root@localhost/queue queue.sql
`)

program
  .argument('<container>', 'the container of the local database')
  .argument('<source>', 'the Data Source Name (DSN) of the remote database')
  .argument('[target]', 'the file to write the diff to', '.docker/{dialect}/initdb.d/{context}/{database}.sql')
  .option('-e, --exclude <exclude...>', 'a list of tables')
  .option('-i, --include <include...>', 'a list of tables')
  .parse()

try {
  const [
    container,
    source,
    target
  ] = program.args

  if (container === undefined) {
    throw new Error('error: missing required argument "container"')
  }

  if (source === undefined) {
    throw new Error('error: missing required argument "source"')
  }

  const {
    exclude,
    include
  } = program.opts()

  const [context] = container.split('_')
  const url = new URL(source)
  const database = url.pathname.slice(1)
  const dialect = url.protocol.slice(0, -1)

  const targetFile = target === undefined
    ? `.docker/${dialect}/initdb.d/${context}/${database}.sql`
    : target

  fs.mkdirSync(path.dirname(targetFile), { recursive: true })

  if (dialect.includes('mysql')) {
    const excludeFlags = (exclude ?? [])
      .map((table) => {
        return `--ignore-table ${database}.${table}`
      })
      .join(' ')

    child.execSync([
    `docker exec ${container} mysqldump`,
    excludeFlags,
    `--host ${url.hostname || '127.0.0.1'}`,
    '--no-data',
    `--password=${decodeURIComponent(url.password || 'root')}`,
    `--port ${url.port || 3306}`,
    '--skip-add-drop-table',
    `--user ${decodeURIComponent(url.username || 'root')}`,
    `--databases ${database}`,
    `> ${targetFile}`
    ].join(' '), {
      stdio: 'inherit'
    })
  }

  if (dialect.includes('postgres')) {
    const excludeFlags = (exclude ?? [])
      .map((table) => {
        return `--exclude-table ${table}`
      })
      .join(' ')

    const includeFlags = (include ?? [])
      .map((table) => {
        return `--table ${table}`
      })
      .join(' ')

    child.execSync([
      'docker exec',
      `--env PGPASSWORD=${decodeURIComponent(url.password || 'root')}`,
      `${container} pg_dump`,
      '--create',
      excludeFlags,
      '--format p',
      `--host ${url.hostname || '127.0.0.1'}`,
      includeFlags,
      '--no-owner',
      `--port ${url.port || 5432}`,
      '--schema-only',
      `--user ${decodeURIComponent(url.username || 'root')}`,
      database,
      `> ${targetFile}`
    ].join(' '), {
      stdio: 'inherit'
    })
  }
} catch (error) {
  logger.error(String(error))
}
