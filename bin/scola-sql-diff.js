const { Command } = require('commander')
const { URL } = require('url')
const child = require('child_process')
const fs = require('fs')
const path = require('path')
const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Dumps the diff of a SQL database and a DDL file.

  Extracts the context (app or lib) from <container> and writes the DDL file
  from ".docker/mysql/initdb.d/{context}/{database}.sql" to
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
  .argument('<container>', 'the container of the local database')
  .argument('<source>', 'the Data Source Name (DSN) of the remote database')
  .argument('[target]', 'the file to write the diff to', '/tmp/scola-sql-diff-out.sql')
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

  const [context] = container.split('_')
  const url = new URL(source)
  const database = url.pathname.slice(1)

  let targetFile = target

  if (targetFile === undefined) {
    targetFile = '/tmp/scola-sql-diff-out.sql'
  }

  fs.mkdirSync(path.dirname(targetFile), { recursive: true })

  child.execSync([
    `cat .docker/mysql/initdb.d/${context}/${database}.sql`,
    '| sed "s/USE/-- USE/g" ',
    '> /tmp/scola-sql-diff-in.sql'
  ].join(' '))

  child.execSync([
    'mysql-schema-diff',
    `--host ${url.hostname || '127.0.0.1'}`,
    '--no-old-defs',
    `--password=${decodeURIComponent(url.password || 'root')}`,
    `--port ${url.port || 3306}`,
    `--user ${decodeURIComponent(url.username || 'root')}`,
    `db:${database}`,
    '/tmp/scola-diff-sql-in.sql',
    `> ${targetFile}`
  ].join(' '))
} catch (error) {
  logger.error(String(error))
}
