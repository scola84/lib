import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase } from '../../server/helpers/sql'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Database } from '../../server/helpers/sql'
import { SchemaParser } from '../../server/helpers/schema'
import type { Struct } from '../../common'

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
  Creates a DDL file from an HTML file.

Example:
  $ scola html-sql contact contact.html#put ./contact
`)

program
  .argument('<object>', 'the name of the object')
  .argument('<source>', 'the HTML file')
  .argument('<dialect>', 'the SQL dialect')
  .argument('[target]', 'the directory to write the DDL file to', process.cwd())
  .parse()

const [
  object,
  source,
  dialect,
  target = process.cwd()
] = program.args

if (typeof databases[dialect] === 'undefined') {
  throw new Error(`Database for dialect "${dialect}" is undefined`)
}

parser
  .parse(source)
  .then((fields) => {
    mkdirSync(target, {
      recursive: true
    })

    writeFileSync(`${target}/${object}.sql`, databases[dialect].formatter.formatDdl(object, fields))
  })
  .catch((error) => {
    logger.error(String(error))
  })
