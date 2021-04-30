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
    ? `.docker/${protocol}/initdb.d/${name}/data/${database}.sql`
    : target

  fs.mkdirSync(path.dirname(targetFile), { recursive: true })

  if (protocol.includes('mysql')) {
    const excludeFlag = (exclude ?? [])
      .map((table) => {
        return `--ignore-table ${database}.${table}`
      })
      .join(' ')

    const includeFlag = (include ?? []).join(' ')

    child.execSync([
        `docker exec ${container} mysqldump`,
        '--compact',
        excludeFlag,
        `--host ${url.hostname || '127.0.0.1'}`,
        '--no-create-info',
        `--password=${url.password || 'root'}`,
        `--port ${url.port || 3306}`,
        `--user ${url.username || 'root'}`,
        database,
        includeFlag,
        `> ${targetFile}`
    ].join(' '), {
      stdio: 'inherit'
    })
  }

  if (protocol.includes('postgres')) {
    const excludeFlag = (exclude ?? [])
      .map((table) => {
        return `--exclude-table ${table}`
      })
      .join(' ')

    const includeFlag = (include ?? [])
      .map((table) => {
        return `--table ${table}`
      })
      .join(' ')

    child.execSync([
      'docker exec',
      `--env PGPASSWORD=${url.password || 'root'}`,
      `${container} pg_dump`,
      '--column-inserts',
      '--data-only',
      excludeFlag,
      '--format p',
      `--host ${url.hostname || '127.0.0.1'}`,
      includeFlag,
      `--port ${url.port || 5432}`,
      '--rows-per-insert 99',
      `--user ${url.username || 'root'}`,
      database,
      `> ${targetFile}`
    ].join(' '), {
      stdio: 'inherit'
    })
  }
} catch (error) {
  logger.error(String(error))
}
