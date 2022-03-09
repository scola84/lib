import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase } from '../../server/helpers/sql'
import { formatDelete, formatFactory, formatGet, formatGetAll, formatPost, formatPut } from './html-api/'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Database } from '../../server/helpers/sql'
import type { Schema } from '../../server/helpers/schema'
import { SchemaParser } from '../../server/helpers/schema'
import type { Struct } from '../../common'

interface Options {
  content: string
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
  .option('-d, --dialect <dialect>', 'dialect of the SQL file', 'postgres')
  .option('-d, --methods <methods>', 'methods to include in the API', 'DELETE|GET|POST|PUT')
  .option('-r, --relation <relation...>', 'name and source file of a related object')
  .option('-t, --type <type>', 'output type', 'ts')
  .option('-u, --url <url>', 'URL of the API', '/api/{object}')
  .parse()

try {
  const parser = new SchemaParser()

  const databases: Struct<Database> = {
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
    objectUrl
  ] = source.split('@')

  const {
    dialect,
    methods,
    relation,
    type,
    url
  } = program.opts<Options>()

  const options = {
    methods,
    object,
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
    .parse(objectUrl)
    .then(async (schema) => {
      const relations: Struct<Schema> = {}

      await Promise.all(relation?.map(async (relationSource) => {
        const [relationObject, relationUrl] = relationSource.split('@')

        await parser
          .parse(relationUrl)
          .then((relationSchema) => {
            relations[relationObject] = relationSchema
          })
      }) ?? [])

      mkdirSync(targetDir, {
        recursive: true
      })

      if (type === 'ts') {
        if (methods.includes('DELETE')) {
          writeFileSync(`${targetDir}/delete.ts`, `${formatDelete(options, schema)}\n`)
        }

        if (methods.includes('GET')) {
          writeFileSync(`${targetDir}/get.ts`, `${formatGet(options, schema)}\n`)
          writeFileSync(`${targetDir}/get-all.ts`, `${formatGetAll(options, schema, relations)}\n`)
        }

        if (methods.includes('POST')) {
          writeFileSync(`${targetDir}/post.ts`, `${formatPost(options, schema)}\n`)
        }

        if (methods.includes('PUT')) {
          writeFileSync(`${targetDir}/put.ts`, `${formatPut(options, schema)}\n`)
        }

        writeFileSync(`${targetDir}/index.ts`, `${formatFactory(options)}\n`)
      } else if (type === 'sql') {
        writeFileSync(`${targetDir}/${object}.sql`, databases[dialect].formatter.formatDdl(object, schema))
      }
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
