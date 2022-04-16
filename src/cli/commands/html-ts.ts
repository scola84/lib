import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Schema } from '../../server/helpers'
import { SchemaParser } from '../../server/helpers'
import type { Struct } from '../../common'
import { formatDeleteAll } from './html-ts/format-delete-all'
import { formatDeleteMany } from './html-ts/format-delete-many'
import { formatDeleteOne } from './html-ts/format-delete-one'
import { formatIndex } from './html-ts/format-index'
import { formatInsertMany } from './html-ts/format-insert-many'
import { formatInsertOne } from './html-ts/format-insert-one'
import { formatSelectAll } from './html-ts/format-select-all'
import { formatSelectMany } from './html-ts/format-select-many'
import { formatSelectOne } from './html-ts/format-select-one'
import { formatUpdateMany } from './html-ts/format-update-many'
import { formatUpdateOne } from './html-ts/format-update-one'
import { sync as glob } from 'glob'
import { isMatch } from 'micromatch'
import { toJoint } from '../../common'

export interface Options {
  actions: string
  id: string
  relation?: string[]
  silent: boolean
  url: string
}

export interface WriteOptions extends Options {
  name: string
  object: string
}

export type Formatter = (schema: Schema, options: WriteOptions, relations: Struct<Schema>) => string

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates TypeScript CRUD handlers from HTML files.

Example:
  $ scola html-ts contact.html ./contact
`)

program
  .argument('<source>', 'source files (glob)')
  .argument('<target>', 'target to write the files to')
  .option('-a, --actions <actions>', 'micromatch pattern to include actions in the API', '{da,dm,do,im,io,sa,sm,so,um,uo}')
  .option('-i, --id <id>', 'id of the element to parse', '')
  .option('-r, --relation <relation...>', 'source file of a related object')
  .option('-s, --silent', 'whether not to log')
  .option('-u, --url <url>', 'URL prefix of the API', '/api/[action-long]/[name]')
  .parse()

try {
  const parser = new SchemaParser()

  const [
    source,
    target
  ] = program.args

  const options = program.opts<Options>()

  if (options.silent) {
    logger.error = () => {}
    logger.log = () => {}
  }

  Promise
    .all(glob(source, {
      nosort: true
    }).map(async (sourceFile) => {
      const parsedSource = await parser.parse(sourceFile, {}, options.id)

      if (parsedSource === undefined) {
        return
      }

      const relations = (await Promise
        .all(options.relation?.map(async (relationFile) => {
          return parser.parse(relationFile)
        }) ?? []))
        .reduce((result, parsedRelation) => {
          if (parsedRelation === undefined) {
            return result
          }

          return {
            ...result,
            [parsedRelation.name]: parsedRelation.schema
          }
        }, {})

      const targetDir = target.replace(/\[name\]/gu, toJoint(parsedSource.name, {
        chars: /[^a-z0-9]+/gui,
        separator: '-'
      }))

      mkdirSync(targetDir, {
        recursive: true
      })

      const writeOptions: WriteOptions = {
        ...options,
        name: toJoint(parsedSource.name, {
          separator: '-'
        }),
        object: parsedSource.name
      }

      const handlers: Array<[string, string, Formatter]> = [
        ['da', `${targetDir}/delete-all.ts`, formatDeleteAll],
        ['dm', `${targetDir}/delete-many.ts`, formatDeleteMany],
        ['do', `${targetDir}/delete-one.ts`, formatDeleteOne],
        ['im', `${targetDir}/insert-many.ts`, formatInsertMany],
        ['io', `${targetDir}/insert-one.ts`, formatInsertOne],
        ['sa', `${targetDir}/select-all.ts`, formatSelectAll],
        ['sm', `${targetDir}/select-many.ts`, formatSelectMany],
        ['so', `${targetDir}/select-one.ts`, formatSelectOne],
        ['um', `${targetDir}/update-many.ts`, formatUpdateMany],
        ['uo', `${targetDir}/update-one.ts`, formatUpdateOne]
      ]

      handlers
        .filter(([key]) => {
          return isMatch(key, options.actions)
        })
        .forEach(([, targetFile, formatter]) => {
          try {
            writeFileSync(targetFile, formatter(parsedSource.schema, writeOptions, relations))
            logger.log(`Created ${targetFile}`)
          } catch (error: unknown) {
            logger.log(`Skipped ${targetFile}`)
          }
        })

      writeFileSync(`${targetDir}/index.ts`, `${formatIndex(writeOptions)}\n`)
      logger.log(`Created ${targetDir}/index.ts`)
    }))
    .catch((error) => {
      logger.error(String(error).toLowerCase())
      process.exit(1)
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
  process.exit(1)
}
