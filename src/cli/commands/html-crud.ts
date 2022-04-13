import { MssqlDatabase, MysqlDatabase, PostgresqlDatabase, SchemaParser } from '../../server/helpers'
import type { Schema, SqlDatabase } from '../../server/helpers'
import { lstatSync, mkdirSync, readdirSync } from 'fs-extra'
import { Command } from 'commander'
import type { Struct } from '../../common'
import { parse } from 'path'
import { toJoint } from '../../common'
import { writeSql } from './html-crud/write-sql'
import { writeTs } from './html-crud/write-ts'

export interface Options {
  actions: string
  database: string
  dialect: string
  name: string
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
  .option('-a, --actions <actions>', 'micromatch pattern to include actions in the API', '{da,dm,do,im,io,sa,sm,so,um,uo}')
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

  const options = program.opts<Options>()

  let targetDir = target

  if (typeof targetDir !== 'string') {
    targetDir = process.cwd()
  }

  if (options.type === 'sql') {
    if (databases[options.dialect] === undefined) {
      throw new Error(`Database for dialect "${options.dialect}" is undefined`)
    }
  }

  Promise
    .resolve()
    .then(async () => {
      let files = []

      if (lstatSync(source).isDirectory()) {
        files = readdirSync(source)
          .map((file) => {
            return `${source}${file}`
          })
      } else {
        files = [source]
      }

      await Promise.all(files.map(async (file) => {
        const fileOptions = {
          ...options
        }

        fileOptions.name = parse(file).name

        fileOptions.object = toJoint(fileOptions.name, {
          separator: '_'
        })

        fileOptions.url = fileOptions.url.replace('{object}', fileOptions.name)

        const schema = await parser.parse(file)
        const relations: Struct<Schema> = {}

        await Promise.all(fileOptions.relation?.map(async (relationFile) => {
          const relationObject = toJoint(parse(relationFile).name, {
            separator: '_'
          })

          await parser
            .parse(relationFile)
            .then((relationSchema) => {
              relations[relationObject] = relationSchema
            })
        }) ?? [])

        mkdirSync(targetDir, {
          recursive: true
        })

        if (fileOptions.type === 'sql') {
          writeSql(targetDir, schema, fileOptions, databases)
        } else if (fileOptions.type === 'ts') {
          writeTs(targetDir, schema, fileOptions, relations)
        }
      }))
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
