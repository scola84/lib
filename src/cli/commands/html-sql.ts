import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase, SchemaParser } from '../../server/helpers'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { SqlDatabase } from '../../server/helpers'
import type { Struct } from '../../common'
import { sync as glob } from 'glob'
import { parse } from 'path'
import { toJoint } from '../../common'

export interface Options {
  database: string
  dialect: string
  id: string
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates a DDL file from an HTML file.

Example:
  $ scola html-sql contact.html#insert ./contact
`)

program
  .argument('<source>', 'source files (glob)')
  .argument('<target>', 'target to write the files to')
  .option('-D, --database <database>', 'database of the SQL file', 'postgres')
  .option('-d, --dialect <dialect>', 'dialect of the SQL file', 'postgres')
  .option('-i, --id <id>', 'id of the element to parse', '')
  .parse()

try {
  const parser = new SchemaParser()

  const databases: Partial<Struct<SqlDatabase>> = {
    mssql: new MssqlDatabase(),
    mysql: new MysqlDatabase(),
    postgres: new PostgresqlDatabase()
  }

  const [
    source,
    target
  ] = program.args

  const options = program.opts<Options>()
  const parsedTarget = parse(target)

  let id = options.id

  if (id !== '') {
    id = `#${id}`
  }

  if (databases[options.dialect] === undefined) {
    throw new Error(`Database for dialect "${options.dialect}" is undefined`)
  }

  Promise
    .all(glob(source, {
      nosort: true
    }).map(async (sourceFile, index) => {
      const name = parse(sourceFile).name

      const object = toJoint(name, {
        separator: '_'
      })

      const targetFile = target
        .replace(/\[index\]/gu, String(index + 1))
        .replace(/\[name\]/gu, name)
        .replace(/\[ext\]/gu, '.sql')

      const schema = await parser.parse(`${sourceFile}${id}`)

      const data = databases[options.dialect]?.formatter.formatDdl(
        options.database,
        object,
        schema
      ) ?? ''

      if (parsedTarget.ext === '') {
        mkdirSync(parsedTarget.dir, {
          recursive: true
        })

        writeFileSync(targetFile, data)
      }

      return data
    }))
    .then((data) => {
      if (parsedTarget.ext !== '') {
        mkdirSync(parsedTarget.dir, {
          recursive: true
        })

        writeFileSync(target, data.join('\n'))
      }
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
