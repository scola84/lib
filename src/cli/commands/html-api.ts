import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase } from '../../server/helpers/sql'
import { formatDeleteMany, formatDeleteOne, formatIndex, formatInsertMany, formatInsertOne, formatSelectAll, formatSelectMany, formatSelectOne, formatUpdateMany, formatUpdateOne } from './html-api/'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Schema } from '../../server/helpers/schema'
import { SchemaParser } from '../../server/helpers/schema'
import type { SqlDatabase } from '../../server/helpers/sql'
import type { Struct } from '../../common'

export interface Options {
  actions: string
  database: string
  dialect: string
  object: string
  relation?: string[]
  type: string
  url: string
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates TypeScript route handlers and DDL files from an HTML file.

Example:
  $ scola html-api contact@contact.html#put ./contact
`)

program
  .argument('<source>', 'name and source file')
  .argument('[target]', 'directory to write the files to', process.cwd())
  .option('-m, --actions <actions>', 'actions to include in the API', 'DISU')
  .option('-D, --database <database>', 'database of the SQL file', 'postgres')
  .option('-d, --dialect <dialect>', 'dialect of the SQL file', 'postgres')
  .option('-r, --relation <relation...>', 'name and source file of a related object')
  .option('-t, --type <type>', 'output type', 'ts')
  .option('-u, --url <url>', 'URL prefix of the API', '/api')
  .parse()

try {
  const parser = new SchemaParser()

  const databases: Struct<SqlDatabase> = {
    mssql: new MssqlDatabase(),
    mysql: new MysqlDatabase(),
    postgres: new PostgresqlDatabase()
  }

  const [
    source,
    target
  ] = program.args

  const [
    object,
    objectFile
  ] = source.split('@')

  const options = program.opts<Options>()

  options.object = object
  options.url = options.url.replace('{object}', object)

  let targetDir = target

  if (typeof targetDir !== 'string') {
    targetDir = process.cwd()
  }

  if (options.type === 'sql') {
    if (typeof databases[options.dialect] === 'undefined') {
      throw new Error(`Database for dialect "${options.dialect}" is undefined`)
    }
  }

  parser
    .parse(objectFile)
    .then(async (schema) => {
      const relations: Struct<Schema> = {}

      await Promise.all(options.relation?.map(async (relationSource) => {
        const [relationObject, relationFile] = relationSource.split('@')

        await parser
          .parse(relationFile)
          .then((relationSchema) => {
            relations[relationObject] = relationSchema
          })
      }) ?? [])

      mkdirSync(targetDir, {
        recursive: true
      })

      if (options.type === 'ts') {
        if (options.actions.includes('D')) {
          writeFileSync(`${targetDir}/delete-many.ts`, `${formatDeleteMany(schema, relations, options)}\n`)
          writeFileSync(`${targetDir}/delete-one.ts`, `${formatDeleteOne(schema, relations, options)}\n`)
        }

        if (options.actions.includes('I')) {
          writeFileSync(`${targetDir}/insert-many.ts`, `${formatInsertMany(schema, relations, options)}\n`)
          writeFileSync(`${targetDir}/insert-one.ts`, `${formatInsertOne(schema, relations, options)}\n`)
        }

        if (options.actions.includes('S')) {
          writeFileSync(`${targetDir}/select-all.ts`, `${formatSelectAll(schema, relations, options)}\n`)
          writeFileSync(`${targetDir}/select-many.ts`, `${formatSelectMany(schema, relations, options)}\n`)
          writeFileSync(`${targetDir}/select-one.ts`, `${formatSelectOne(schema, relations, options)}\n`)
        }

        if (options.actions.includes('U')) {
          writeFileSync(`${targetDir}/update-many.ts`, `${formatUpdateMany(schema, relations, options)}\n`)
          writeFileSync(`${targetDir}/update-one.ts`, `${formatUpdateOne(schema, relations, options)}\n`)
        }

        writeFileSync(`${targetDir}/index.ts`, `${formatIndex(options)}\n`)
      } else if (options.type === 'sql') {
        writeFileSync(`${targetDir}/${object}.sql`, databases[options.dialect].formatter.formatDdl(options.database, object, schema))
      }
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
