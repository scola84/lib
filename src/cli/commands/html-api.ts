import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase } from '../../server/helpers/sql'
import { barrel, del, get, getAll, post, put } from './html-api/'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Database } from '../../server/helpers/sql'
import { SchemaParser } from '../../server/helpers/schema'
import type { Struct } from '../../common'

interface Options {
  dialect: string
  type: string
}

const logger = console
const parser = new SchemaParser()
const program = new Command()

const databases: Struct<Database> = {
  mssql: new MssqlDatabase(),
  mysql: new MysqlDatabase(),
  postgres: new PostgresqlDatabase()
}

program.addHelpText('after', `
Description:
  Creates TypeScript route handlers and DDL files from an HTML file.

Example:
  $ scola html-api contact contact.html#put ./contact
`)

program
  .argument('<object>', 'the name of the object')
  .argument('<source>', 'the HTML file')
  .argument('[target]', 'the directory to write the handlers to', process.cwd())
  .option('-d, --dialect [dialect]', 'the dialect of the SQL file')
  .option('-t, --type <type>', 'the output type {ts,sql}', 'ts')
  .parse()

try {
  const [
    object,
    source,
    target = process.cwd()
  ] = program.args

  const {
    dialect,
    type
  } = program.opts<Options>()

  if (type === 'sql') {
    if (typeof dialect === 'undefined') {
      throw new Error('Missing required option \'dialect\'')
    }

    if (typeof databases[dialect] === 'undefined') {
      throw new Error(`Database for dialect "${dialect}" is undefined`)
    }
  }

  parser
    .parse(source)
    .then((fields) => {
      mkdirSync(target, {
        recursive: true
      })

      if (type === 'ts') {
        writeFileSync(`${target}/delete.ts`, `${del(object)}\n`)
        writeFileSync(`${target}/get.ts`, `${get(object)}\n`)
        writeFileSync(`${target}/get-all.ts`, `${getAll(object, fields)}\n`)
        writeFileSync(`${target}/index.ts`, `${barrel(object)}\n`)
        writeFileSync(`${target}/post.ts`, `${post(object, fields)}\n`)
        writeFileSync(`${target}/put.ts`, `${put(object, fields)}\n`)
      } else if (type === 'sql') {
        writeFileSync(`${target}/${object}.sql`, databases[dialect].formatter.formatDdl(object, fields))
      }
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
