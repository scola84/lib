import { MssqlDatabase, MysqlDatabase, PgsqlDatabase, SchemaParser } from '../../server/helpers'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { SqlDatabase } from '../../server/helpers'
import type { Struct } from '../../common'
import { sync as glob } from 'glob'
import { parse } from 'path'

export interface Options {
  database: string
  dialect: string
  id: string
  silent: boolean
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates DDL files from HTML files.

Example:
  $ scola html-sql contact.html#insert ./contact
`)

program
  .argument('<source>', 'source files')
  .argument('<target>', 'target file or directory')
  .option('-D, --database <database>', 'database of the SQL file', 'postgres')
  .option('-d, --dialect <dialect>', 'dialect of the SQL file', 'pgsql')
  .option('-i, --id <id>', 'id of the element to parse', '')
  .option('-s, --silent', 'whether to log')
  .parse()

try {
  const parser = new SchemaParser()

  const databases: Partial<Struct<SqlDatabase>> = {
    mssql: new MssqlDatabase(),
    mysql: new MysqlDatabase(),
    pgsql: new PgsqlDatabase()
  }

  const [
    source,
    target
  ] = program.args

  const options = program.opts<Options>()

  if (options.silent) {
    logger.error = () => {}
    logger.log = () => {}
  }

  const parsedTarget = parse(target)

  if (databases[options.dialect] === undefined) {
    throw new Error(`Database for dialect "${options.dialect}" is undefined`)
  }

  Promise
    .all(glob(source, {
      nosort: true
    }).map(async (sourceFile, index) => {
      const parsedSource = await parser.parse(sourceFile, {}, options.id)

      if (parsedSource === undefined) {
        return undefined
      }

      const ddl = databases[options.dialect]?.formatter.formatDdl(
        options.database,
        parsedSource.name,
        parsedSource.schema
      )

      if (parsedTarget.ext === '') {
        mkdirSync(parsedTarget.dir, {
          recursive: true
        })

        const targetFile = target
          .replace(/\[index\]/gu, String(index).padStart(2, '0'))
          .replace(/\[name\]/gu, parsedSource.name)
          .replace(/\[ext\]/gu, '.sql')

        writeFileSync(targetFile, `${[
          ddl?.connect,
          ddl?.create,
          ddl?.indexes,
          ddl?.fkeys
        ].filter((line) => {
          return line !== ''
        }).join('\n')}\n`)

        logger.log(`Created ${targetFile}`)
      }

      return ddl
    }))
    .then((data) => {
      if (parsedTarget.ext !== '') {
        mkdirSync(parsedTarget.dir, {
          recursive: true
        })

        writeFileSync(target, `${[
          data
            .reduce((result, ddl) => {
              return ddl?.connect ?? ''
            }, ''),
          data
            .map((ddl) => {
              return ddl?.create
            })
            .filter((line) => {
              return line !== ''
            })
            .join('\n'),
          data
            .map((ddl) => {
              return ddl?.indexes
            })
            .filter((line) => {
              return line !== ''
            })
            .join('\n'),
          data
            .map((ddl) => {
              return ddl?.fkeys
            })
            .filter((line) => {
              return line !== ''
            })
            .join('\n')
        ].join('\n')}\n`)

        logger.log(`Created ${target}`)
      }
    })
    .catch((error) => {
      logger.error(String(error).toLowerCase())
      process.exit(1)
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
  process.exit(1)
}
