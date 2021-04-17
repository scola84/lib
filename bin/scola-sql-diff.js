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
    source,
    target
  ] = program.args

  if (source === undefined) {
    throw new Error('error: missing required argument "source"')
  }

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
} catch (error) {
  logger.error(String(error))
}
