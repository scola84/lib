/* eslint-disable no-console */

import { Logger } from './logger.js'

export class DevoutLogger extends Logger {
  write (type, pid, message, args) {
    console.log(`${pid} [${type}] ${message}`, ...args)
  }
}
