import { Command } from 'commander'
import { URL } from 'url'
import { dirname } from 'path'
import { execSync } from 'child_process'
import { mkdirSync } from 'fs-extra'

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Dumps the diff of a SQL database and a DDL file.

  Extracts the context (app or lib) from <container> and writes the DDL file
  from ".docker/mysql/docker-entrypoint-initdb.d/{context}/{database}.sql" to
  "/tmp/scola-sql-diff-in.sql".

  Runs mysql-schema-diff to compare the remote database at <source> with the
  DDL file and writes the diff to [target].

  Currently only MySQL is supported.

  See http://manpages.ubuntu.com/manpages/trusty/man1/mysql-schema-diff.1p.html
  for more information about the diff operation.

Example:
  $ scola sql-diff lib_mysql_1 mysql://root:root@localhost/queue queue.sql
`)

program
  .argument('<container>', 'container of the local database')
  .argument('<source>', 'Data Source Name (DSN) of the remote database')
  .argument('[target]', 'file to write the diff to', '/tmp/scola-sql-diff-out.sql')
  .parse()

try {
  const [
    container,
    source,
    target
  ] = program.args

  const [context] = container.split('_')
  const url = new URL(source)
  const database = url.pathname.slice(1)

  let targetFile = target

  if (typeof targetFile !== 'string') {
    targetFile = '/tmp/scola-sql-diff-out.sql'
  }

  if (typeof url.hostname !== 'string') {
    url.hostname = '127.0.0.1'
  }

  if (typeof url.password !== 'string') {
    url.password = 'root'
  }

  if (typeof url.port !== 'string') {
    url.port = '3306'
  }

  if (typeof url.username !== 'string') {
    url.username = 'root'
  }

  mkdirSync(dirname(targetFile), {
    recursive: true
  })

  execSync([
    `cat .docker/mysql/docker-entrypoint-initdb.d/${context}/${database}.sql`,
    '| sed "s/USE/-- USE/g" ',
    '> /tmp/scola-sql-diff-in.sql'
  ].join(' '))

  execSync([
    'mysql-schema-diff',
    `--host ${url.hostname}`,
    '--no-old-defs',
    `--password=${decodeURIComponent(url.password)}`,
    `--port ${url.port}`,
    `--user ${decodeURIComponent(url.username)}`,
    `db:${database}`,
    '/tmp/scola-sql-diff-in.sql',
    `> ${targetFile}`
  ].join(' '))
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
  process.exit(1)
}
