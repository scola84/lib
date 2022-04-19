import { randomBytes, scrypt } from 'crypto'
import { Command } from 'commander'
import { Secret } from 'otpauth'

export interface Options {
  keylen: string
  saltlen: string
}

const logger = console
const program = new Command()

program.addHelpText('after', `
Description:
  Generates a secret.

Example:
  $ scola secret password scola
`)

program
  .argument('<type>', 'type of secret')
  .argument('[secret]', 'plain secret', '')
  .option('-k, --keylen <keylen>', 'length of the derived password', '64')
  .option('-s, --saltlen <saltlen>', 'length of the salt', '8')
  .parse()

try {
  const [
    type,
    secret
  ] = program.args

  const options = program.opts<Options>()

  if (type === 'totp') {
    logger.log(new Secret({ size: Number(options.keylen) }).base32)
    process.exit()
  } else if (type === 'password') {
    if (typeof secret === 'undefined') {
      throw new Error('Password is undefined')
    }

    const salt = randomBytes(Number(options.saltlen))

    scrypt(secret, salt, Number(options.keylen), (error, derivedKey) => {
      if (error === null) {
        logger.log(`${salt.toString('hex')}:${derivedKey.toString('hex')}`)
      } else {
        logger.error(String(error).toLowerCase())
        process.exit(1)
      }
    })
  } else {
    throw new Error('Type is undefined')
  }
} catch (error: unknown) {
  logger.error(String(error).toLowerCase())
  process.exit(1)
}
