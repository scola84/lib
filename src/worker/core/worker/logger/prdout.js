/* eslint-disable no-console */

import { Logger } from './logger.js'

export class PrdoutLogger extends Logger {
  setTypes (value = 'fail') {
    return super.setTypes(value)
  }

  write (type, pid, message, args) {
    console.log(`${pid} [${type}] ${message}`, ...args)
  }
}
