const { Command } = require('commander')
const { URL } = require('url')
const child = require('child_process')
const fs = require('fs')
const path = require('path')
const logger = console
const program = new Command()

try {
  program.parse()

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

  const [name] = container.split('_')
  const url = new URL(source)
  const database = url.pathname.slice(1)

  const targetFile = target === undefined
    ? '/tmp/scola-sql-diff-out.sql'
    : target

  fs.mkdirSync(path.dirname(targetFile), { recursive: true })

  child.execSync([
    `cat .docker/mysql/initdb.d/${name}/${database}.sql`,
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
