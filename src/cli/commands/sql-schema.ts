import { Command } from 'commander'
import { URL } from 'url'
import child from 'child_process'
import fs from 'fs'
import path from 'path'

interface Options {
  exclude?: string[]
  include?: string[]
}

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
  .argument('[target]', 'the file to write the diff to', '.docker/{dialect}/docker-entrypoint-initdb.d/{context}/{database}.sql')
  .option('-e, --exclude <exclude...>', 'a list of tables')
  .option('-i, --include <include...>', 'a list of tables')
  .parse()

try {
  const [
    container,
    source,
    target
  ] = program.args

  const {
    exclude,
    include
  } = program.opts<Options>()

  const [context] = container.split('_')
  const url = new URL(source)
  const database = url.pathname.slice(1)
  const dialect = url.protocol.slice(0, -1)

  let targetFile = target

  if (typeof targetFile !== 'string') {
    targetFile = `.docker/${dialect}/initdb.d/${context}/${database}.sql`
  }

  if (typeof url.hostname !== 'string') {
    url.hostname = '127.0.0.1'
  }

  if (typeof url.password !== 'string') {
    url.password = 'root'
  }

  if (typeof url.port !== 'string') {
    url.port = '5432'
  }

  if (typeof url.username !== 'string') {
    url.username = 'root'
  }

  fs.mkdirSync(path.dirname(targetFile), {
    recursive: true
  })

  if (dialect.includes('mysql')) {
    const excludeFlags = (exclude ?? [])
      .map((table) => {
        return `--ignore-table ${database}.${table}`
      })
      .join(' ')

    child.execSync([
      `docker exec ${container} mysqldump`,
      excludeFlags,
      `--host ${url.hostname}`,
      '--no-data',
      `--password=${decodeURIComponent(url.password)}`,
      `--port ${url.port}`,
      '--skip-add-drop-table',
      `--user ${decodeURIComponent(url.username)}`,
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
      `--env PGPASSWORD=${decodeURIComponent(url.password)}`,
      `${container} pg_dump`,
      '--create',
      excludeFlags,
      '--format p',
      `--host ${url.hostname}`,
      includeFlags,
      '--no-owner',
      `--port ${url.port}`,
      '--schema-only',
      `--user ${decodeURIComponent(url.username)}`,
      database,
      `> ${targetFile}`
    ].join(' '), {
      stdio: 'inherit'
    })
  }
} catch (error: unknown) {
  logger.error(String(error))
}
