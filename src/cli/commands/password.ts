import { randomBytes, scrypt } from 'crypto'
import { Command } from 'commander'

export interface Options {
  keylen: string
  saltlen: string
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Generates a derived password with scrypt.

Example:
  $ scola password scola
`)

program
  .argument('[password]', 'the password')
  .option('-k, --keylen', 'the length of the derived password', '64')
  .option('-s, --saltlen', 'the length of the salt', '8')
  .parse()

const [password] = program.args
const options = program.opts<Options>()
const salt = randomBytes(Number(options.saltlen))

scrypt(password, salt, Number(options.keylen), (error, derivedKey) => {
  if (error === null) {
    logger.log(`${salt.toString('hex')}:${derivedKey.toString('hex')}`)
  } else {
    logger.error(String(error).toLowerCase())
    process.exit(1)
  }
})
