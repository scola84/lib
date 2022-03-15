import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase } from '../../server/helpers/sql'
import { formatDelete, formatGet, formatGetAll, formatIndex, formatPatch, formatPost, formatPut } from './html-api/'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Schema } from '../../server/helpers/schema'
import { SchemaParser } from '../../server/helpers/schema'
import type { SqlDatabase } from '../../server/helpers/sql'
import type { Struct } from '../../common'

interface Options {
  database: string
  dialect: string
  methods: string
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
  .option('-D, --database <database>', 'database of the SQL file', 'postgres')
  .option('-d, --dialect <dialect>', 'dialect of the SQL file', 'postgres')
  .option('-m, --methods <methods>', 'methods to include in the API', 'DELETE,GET,PATCH,POST,PUT')
  .option('-r, --relation <relation...>', 'name and source file of a related object')
  .option('-t, --type <type>', 'output type', 'ts')
  .option('-u, --url <url>', 'URL of the API', '/api/{object}')
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

  const {
    database,
    dialect,
    methods,
    relation,
    type,
    url
  } = program.opts<Options>()

  const options = {
    methods: methods,
    object: object,
    url: url.replace('{object}', object)
  }

  let targetDir = target

  if (typeof targetDir !== 'string') {
    targetDir = process.cwd()
  }

  if (type === 'sql') {
    if (typeof databases[dialect] === 'undefined') {
      throw new Error(`Database for dialect "${dialect}" is undefined`)
    }
  }

  parser
    .parse(objectFile)
    .then(async (schema) => {
      const relations: Struct<Schema> = {}

      await Promise.all(relation?.map(async (relationSource) => {
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

      if (type === 'ts') {
        if (methods.includes('DELETE')) {
          writeFileSync(`${targetDir}/delete.ts`, `${formatDelete(options, schema, relations)}\n`)
        }

        if (methods.includes('GET')) {
          writeFileSync(`${targetDir}/get.ts`, `${formatGet(options, schema, relations)}\n`)
          writeFileSync(`${targetDir}/get-all.ts`, `${formatGetAll(options, schema, relations)}\n`)
        }

        if (methods.includes('PATCH')) {
          writeFileSync(`${targetDir}/patch.ts`, `${formatPatch(options, schema, relations)}\n`)
        }

        if (methods.includes('POST')) {
          writeFileSync(`${targetDir}/post.ts`, `${formatPost(options, schema, relations)}\n`)
        }

        if (methods.includes('PUT')) {
          writeFileSync(`${targetDir}/put.ts`, `${formatPut(options, schema, relations)}\n`)
        }

        writeFileSync(`${targetDir}/index.ts`, `${formatIndex(options)}\n`)
      } else if (type === 'sql') {
        writeFileSync(`${targetDir}/${object}.sql`, databases[dialect].formatter.formatDdl(database, object, schema))
      }
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
