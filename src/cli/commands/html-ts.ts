import { barrel, del, get, getAll, post, put } from './html-ts/'
import { mkdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import { SchemaParser } from '../../server/helpers/schema'

const logger = console
const parser = new SchemaParser()
const program = new Command()

program.addHelpText('after', `
Description:
  Creates TypeScript route handlers from an HTML file.

Example:
  $ scola html-ts contact contact-add.html ./contact
`)

program
  .argument('<object>', 'the name of the object')
  .argument('<source>', 'the HTML file')
  .argument('[target]', 'the directory to write the handlers to', process.cwd())
  .parse()

const [
  object,
  source,
  target = process.cwd()
] = program.args

parser
  .parse(source)
  .then((fields) => {
    mkdirSync(target, {
      recursive: true
    })

    writeFileSync(`${target}/delete.ts`, `${del(object)}\n`)
    writeFileSync(`${target}/get.ts`, `${get(object)}\n`)
    writeFileSync(`${target}/get-all.ts`, `${getAll(object, fields)}\n`)
    writeFileSync(`${target}/index.ts`, `${barrel(object)}\n`)
    writeFileSync(`${target}/post.ts`, `${post(object, fields)}\n`)
    writeFileSync(`${target}/put.ts`, `${put(object, fields)}\n`)
  })
  .catch((error) => {
    logger.error(String(error))
  })
