const { Command } = require('commander')
const { URL } = require('url')
const child = require('child_process')
const fs = require('fs')
const path = require('path')

const logger = console
const program = new Command()

program.parse()

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

  const [name] = container.split('_')
  const url = new URL(source)
  const database = url.pathname.slice(1)
  const protocol = url.protocol.slice(0, -1)

  const targetFile = target === undefined
    ? `.docker/${protocol}/initdb.d/${name}/diff/${database}.sql`
    : target

  fs.mkdirSync(path.dirname(targetFile), { recursive: true })

  child.execSync([
    `cat .docker/mysql/initdb.d/schema/${database}.sql`,
    '| sed "s/USE/-- USE/g" ',
    '> /tmp/scola-diff.sql'
  ].join(' '))

  child.execSync([
    'mysql-schema-diff',
    `--host ${url.hostname || '127.0.0.1'}`,
    '--no-old-defs',
    `--password=${url.password ?? 'root'}`,
    `--port ${url.port || 3306}`,
    `--user ${url.username || 'root'}`,
    `db:${database}`,
    '/tmp/scola-diff.sql',
    `> ${targetFile}`
  ].join(' '))

  child.execSync('rm /tmp/scola-diff.sql')
} catch (error) {
  logger.error(String(error))
}
