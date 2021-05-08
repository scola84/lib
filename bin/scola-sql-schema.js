const { Command } = require('commander')
const { URL } = require('url')
const child = require('child_process')
const fs = require('fs')
const path = require('path')

const logger = console
const program = new Command()

program
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

  const [name] = container.split('_')
  const url = new URL(source)
  const database = url.pathname.slice(1)
  const protocol = url.protocol.slice(0, -1)

  const targetFile = target === undefined
    ? `.docker/${protocol}/initdb.d/${name}/schema/${database}.sql`
    : target

  fs.mkdirSync(path.dirname(targetFile), { recursive: true })

  if (protocol.includes('mysql')) {
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

  if (protocol.includes('postgres')) {
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
