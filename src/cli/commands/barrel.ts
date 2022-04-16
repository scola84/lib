import { formatName, formatWildcard, readers } from './barrel/'
import { Command } from 'commander'
import { writeFileSync } from 'fs-extra'

export interface Options {
  defaults: boolean
  name?: string
  prefix: string
  shorthand: boolean
  type: string
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates a barrel file.

Example:
  $ scola barrel
`)

program
  .argument('[target]', 'directory to create the barrel for', process.cwd())
  .option('-d, --defaults', 'whether to import defaults', false)
  .option('-n, --name <name>', 'output name')
  .option('-p, --prefix <prefix>', 'prefix of the named export properties', '')
  .option('-s, --shorthand', 'whether to export shorthand properties', false)
  .option('-t, --type <type>', 'output type', 'ts')
  .parse()

try {
  const [target] = program.args
  const options = program.opts<Options>()

  let targetDir = target

  if (typeof targetDir !== 'string') {
    targetDir = process.cwd()
  }

  if (readers[options.type] === undefined) {
    throw new Error(`Reader for type "${options.type}" is undefined`)
  }

  const files = readers[options.type]?.(targetDir) ?? []

  files.sort(([,leftBase], [,rightBase]) => {
    if (rightBase.includes(leftBase)) {
      return -1
    }

    if (leftBase < rightBase) {
      return -1
    }

    return 1
  })

  let data = ''

  if (options.name === undefined) {
    data = formatWildcard(files)
  } else {
    data = formatName(files, options)
  }

  writeFileSync(`${targetDir}/index.ts`, `${data}\n`)
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
  process.exit(1)
}
