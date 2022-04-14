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
import { parse } from 'path'
import { toJoint } from '../../common'

export interface Options {
  actions: string
  id: string
  relation?: string[]
  url: string
}

export interface WriteOptions extends Options {
  name: string
  object: string
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates TypeScript interfaces from an HTML file.

Example:
  $ scola html-ts contact.html ./contact
`)

program
  .argument('<source>', 'source files (glob)')
  .argument('<target>', 'target to write the files to')
  .option('-a, --actions <actions>', 'micromatch pattern to include actions in the API', '{da,dm,do,im,io,sa,sm,so,um,uo}')
  .option('-i, --id <id>', 'id of the element to parse', '')
  .option('-r, --relation <relation...>', 'source file of a related object')
  .option('-u, --url <url>', 'URL prefix of the API', '/api/[action-long]/[name]')
  .parse()

try {
  const parser = new SchemaParser()

  const [
    source,
    target
  ] = program.args

  const options = program.opts<Options>()

  let id = options.id

  if (id !== '') {
    id = `#${id}`
  }

  Promise
    .all(glob(source, {
      nosort: true
    }).map(async (sourceFile) => {
      const name = parse(sourceFile).name

      const writeOptions: WriteOptions = {
        ...options,
        name: name,
        object: toJoint(name, {
          separator: '_'
        })
      }

      const targetDir = target.replace(/\[name\]/gu, name)
      const schema = await parser.parse(`${sourceFile}${id}`)
      const relations: Struct<Schema> = {}

      await Promise.all(options.relation?.map(async (relationFile) => {
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

      Object
        .entries({
          'da': [`${targetDir}/delete-all.ts`, `${formatDeleteAll(schema, writeOptions)}\n`],
          'dm': [`${targetDir}/delete-many.ts`, `${formatDeleteMany(schema, writeOptions)}\n`],
          'do': [`${targetDir}/delete-one.ts`, `${formatDeleteOne(schema, writeOptions)}\n`],
          'im': [`${targetDir}/insert-many.ts`, `${formatInsertMany(schema, writeOptions)}\n`],
          'io': [`${targetDir}/insert-one.ts`, `${formatInsertOne(schema, writeOptions)}\n`],
          'sa': [`${targetDir}/select-all.ts`, `${formatSelectAll(schema, writeOptions, relations)}\n`],
          'sm': [`${targetDir}/select-many.ts`, `${formatSelectMany(schema, writeOptions)}\n`],
          'so': [`${targetDir}/select-one.ts`, `${formatSelectOne(schema, writeOptions)}\n`],
          'um': [`${targetDir}/update-many.ts`, `${formatUpdateMany(schema, writeOptions)}\n`],
          'uo': [`${targetDir}/update-one.ts`, `${formatUpdateOne(schema, writeOptions)}\n`]

        })
        .filter(([key]) => {
          return isMatch(key, options.actions)
        })
        .forEach(([, [targetFile, data]]) => {
          writeFileSync(targetFile, data)
        })

      writeFileSync(`${targetDir}/index.ts`, `${formatIndex(writeOptions)}\n`)
    }))
    .catch((error) => {
      logger.error(String(error).toLowerCase())
    })
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
