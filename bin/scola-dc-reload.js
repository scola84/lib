const child = require('child_process')
const { Command } = require('commander')

const logger = console
const program = new Command()

program.parse()

try {
  const [service] = program.args

  if (service === undefined) {
    throw new Error('error: missing required argument "service"')
  }

  child.execSync([
    'docker-compose rm',
    '--force',
    '--stop',
    service
  ].join(' '), {
    stdio: 'inherit'
  })

  child.execSync([
    'docker-compose up',
    '--detach',
    service
  ].join(' '), {
    stdio: 'inherit'
  })
} catch (error) {
  logger.error(String(error))
}
