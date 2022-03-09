import { camelize, formatGroup } from './barrel/'
import { readdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'
import type { Struct } from '../../common'

interface Options {
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
  .option('-t, --type <type>', 'output type', 'ts')
  .parse()

try {
  const [target] = program.args
  const { type } = program.opts<Options>()

  let targetDir = target

  if (typeof targetDir !== 'string') {
    targetDir = process.cwd()
  }

  const writers: Struct<(() => void) | undefined> = {
    html: () => {
      const files = readdirSync(targetDir)
        .filter((file) => {
          return file !== 'index.ts'
        })
        .map((file) => {
          return file.replace('.html', '')
        })
        .sort((left, right) => {
          if (right.includes(left)) {
            return -1
          }

          if (left < right) {
            return -1
          }

          return 1
        })

      const imports = files
        .map((file) => {
          return `import ${camelize(file)} from './${file}.html'`
        })
        .join('\n')

      const exports = files
        .map((file) => {
          return camelize(file)
        })

      return [
        imports,
        `export ${formatGroup(exports, 0)}`
      ].join('\n\n')
    },
    ts: () => {
      return readdirSync(targetDir)
        .filter((file) => {
          return file !== 'index.ts'
        })
        .map((file) => {
          return file.replace('.ts', '')
        })
        .map((file) => {
          return `export * from './${file}'`
        })
        .join('\n')
    }
  }

  if (writers[type] === undefined) {
    throw new Error(`Writer for type "${type}" is undefined`)
  }

  writeFileSync(`${targetDir}/index.ts`, `${writers[type]?.() ?? ''}\n`)
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
}
