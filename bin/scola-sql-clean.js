const child = require('child_process')
const { Command } = require('commander')

const logger = console
const program = new Command()

program.parse()

try {
  const dirs = [
    'data',
    'diff'
  ]

  const protocols = [
    'mysql',
    'postgres'
  ]

  for (const protocol of protocols) {
    for (const dir of dirs) {
      child.execSync([
        'rm',
        '--force',
        '--recursive',
        `.deploy/${protocol}/initdb.d/${dir}`
      ].join(' '), {
        stdio: 'inherit'
      })
    }
  }
} catch (error) {
  logger.error(String(error))
}
