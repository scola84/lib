import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase, SchemaParser } from '../../server/helpers'
import type { Schema, SqlDatabase } from '../../server/helpers'
import { formatDeleteAll, formatDeleteMany, formatDeleteOne, formatIndex, formatInsertMany, formatInsertOne, formatSelectAll, formatSelectMany, formatSelectOne, formatUpdateMany, formatUpdateOne } from './html-crud/'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Struct } from '../../common'
import { isMatch } from 'micromatch'

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
  $ scola html-crud contact@contact.html#put ./contact
`)

program
  .argument('<source>', 'name and source file')
  .argument('[target]', 'directory to write the files to', process.cwd())
  .option('-m, --actions <actions>', 'micromatch pattern to include actions in the API', '{da,dm,do,im,io,sa,sm,so,um,uo}')
  .option('-D, --database <database>', 'database of the SQL file', 'postgres')
  .option('-d, --dialect <dialect>', 'dialect of the SQL file', 'postgres')
  .option('-r, --relation <relation...>', 'name and source file of a related object')
  .option('-t, --type <type>', 'output type', 'ts')
  .option('-u, --url <url>', 'URL prefix of the API', '/api')
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
    if (databases[options.dialect] === undefined) {
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
        Object
          .entries({
            'da': [`${targetDir}/delete-all.ts`, `${formatDeleteAll(schema, options)}\n`],
            'dm': [`${targetDir}/delete-many.ts`, `${formatDeleteMany(schema, options)}\n`],
            'do': [`${targetDir}/delete-one.ts`, `${formatDeleteOne(schema, options)}\n`],
            'im': [`${targetDir}/insert-many.ts`, `${formatInsertMany(schema, options)}\n`],
            'io': [`${targetDir}/insert-one.ts`, `${formatInsertOne(schema, options)}\n`],
            'sa': [`${targetDir}/select-all.ts`, `${formatSelectAll(schema, options, relations)}\n`],
            'sm': [`${targetDir}/select-many.ts`, `${formatSelectMany(schema, options)}\n`],
            'so': [`${targetDir}/select-one.ts`, `${formatSelectOne(schema, options)}\n`],
            'um': [`${targetDir}/update-many.ts`, `${formatUpdateMany(schema, options)}\n`],
            'uo': [`${targetDir}/update-one.ts`, `${formatUpdateOne(schema, options)}\n`]

          })
          .filter(([key]) => {
            return isMatch(key, options.actions)
          })
          .forEach(([, [path, content]]) => {
            writeFileSync(path, content)
          })

        writeFileSync(`${targetDir}/index.ts`, `${formatIndex(options)}\n`)
      } else if (options.type === 'sql') {
        writeFileSync(`${targetDir}/${object}.sql`, databases[options.dialect]?.formatter.formatDdl(options.database, object, schema) ?? '')
      }
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
