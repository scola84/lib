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

  const url = new URL(source)
  const database = url.pathname.slice(1)
  const protocol = url.protocol.slice(0, -1)

  const targetFile = target === undefined
    ? `.deploy/${protocol}/initdb.d/data/${database}.sql`
    : target

  fs.mkdirSync(path.dirname(targetFile), { recursive: true })

  if (protocol.includes('mysql')) {
    const exclude = (program.exclude ?? [])
      .map((table) => {
        return `--ignore-table ${database}.${table}`
      })
      .join(' ')

    const include = (program.include ?? []).join(' ')

    child.execSync([
        `docker exec ${container} mysqldump`,
        '--compact',
        exclude,
        `--host ${url.hostname}`,
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

  if (protocol.includes('postgres')) {
    const exclude = (program.exclude ?? [])
      .map((table) => {
        return `--exclude-table ${table}`
      })
      .join(' ')

    const include = (program.include ?? [])
      .map((table) => {
        return `--table ${table}`
      })
      .join(' ')

    child.execSync([
      'docker exec',
      url.password ? `--env PGPASSWORD=${url.password}` : '',
        `${container} pg_dump`,
        '--column-inserts',
        '--data-only',
        exclude,
        '--format p',
        `--host ${url.hostname}`,
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
} catch (error) {
  logger.error(String(error))
}
