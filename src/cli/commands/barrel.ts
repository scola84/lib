import { formatName, formatWildcard, readers } from './barrel/'
import { Command } from 'commander'
import { writeFileSync } from 'fs-extra'

interface Options {
  defaults?: boolean
  name?: string
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
  .option('-d, --defaults', 'whether to import defaults')
  .option('-n, --name <name>', 'output name')
  .option('-t, --type <type>', 'output type', 'ts')
  .parse()

try {
  const [target] = program.args

  const {
    defaults,
    name,
    type
  } = program.opts<Options>()

  let targetDir = target

  if (typeof targetDir !== 'string') {
    targetDir = process.cwd()
  }

  if (readers[type] === undefined) {
    throw new Error(`Reader for type "${type}" is undefined`)
  }

  const files = readers[type]?.(targetDir) ?? []

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

  if (name === undefined) {
    data = formatWildcard(files)
  } else {
    data = formatName(files, name, defaults)
  }

  writeFileSync(`${targetDir}/index.ts`, `${data}\n`)
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
