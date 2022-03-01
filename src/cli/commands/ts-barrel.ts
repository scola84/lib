import { readdirSync, writeFileSync } from 'fs-extra'
import { Command } from 'commander'

const program = new Command()

program.addHelpText('after', `
Description:
  Creates a TypeScript barrel in the current working directory.

Example:
  $ scola ts-barrel
`)

const cwd = process.cwd()

const content = readdirSync(cwd)
  .filter((file) => {
    return file !== 'index.ts'
  })
  .map((file) => {
    return `export * from './${file.replace('.ts', '')}'`
  })
  .join('\n')

writeFileSync(`${cwd}/index.ts`, `${content}\n`)
