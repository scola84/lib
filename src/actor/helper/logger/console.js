import { Logger } from './logger.js'

export class ConsoleLogger extends Logger {
  write (type, lid, message, args) {
    this._client.log(`${lid} [${type}] ${message}`, ...args)
  }
}
