import { Logger } from './logger.js'

export class ConsoleLogger extends Logger {
  write (type, pid, message, args) {
    this._client.log(`${pid} [${type}] ${message}`, ...args)
  }
}
