const child = require('child_process')
const { Command } = require('commander')
const logger = console
const program = new Command()

try {
  program.parse()

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
        `.docker/${protocol}/initdb.d/*/${dir}`
      ].join(' '), {
        stdio: 'inherit'
      })
    }
  }
} catch (error) {
  logger.error(String(error))
}
