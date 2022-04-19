import { formatName, formatWildcard } from './barrel/'
import { toCaps, toJoint } from '../../common'
import { Command } from 'commander'
import { sync as glob } from 'glob'
import { writeFileSync } from 'fs-extra'

export interface Options {
  defaults: boolean
  name?: string
  prefix: string
  shorthand: boolean
  subdir: boolean
  type: string
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Creates a barrel file.

Example:
  $ scola barrel ./src
`)

program
  .argument('[target]', 'target directory', process.cwd())
  .option('-d, --defaults', 'whether to import defaults', false)
  .option('-n, --name <name>', 'output name')
  .option('-p, --prefix <prefix>', 'prefix of the named export properties', '')
  .option('-s, --shorthand', 'whether to export shorthand properties', false)
  .option('-S, --subdir', 'whether to scan subdirectories', false)
  .parse()

try {
  const [target] = program.args
  const options = program.opts<Options>()

  let targetDir = target

  if (typeof targetDir !== 'string') {
    targetDir = process.cwd()
  }

  let pattern = '*'

  if (options.subdir) {
    pattern = '**/*.{css,html,js,ts}'
  }

  const files = glob(`${targetDir}/${pattern}`)
    .filter((file) => {
      return !file.endsWith('index.ts')
    })
    .map((file) => {
      const path = file
        .replace(targetDir, '')
        .replace('.ts', '')

      const name = toJoint(path.split('.')[0], {
        lower: false,
        separator: '-'
      })

      return [
        path,
        name,
        toCaps(name, {
          lcfirst: true
        })
      ]
    })

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
