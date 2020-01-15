import { logger } from './logger/index.js'

export class Logger {
  static get (type = 'default') {
    return logger[type]
  }

  static set (type, object) {
    logger[type] = typeof object === 'string'
      ? logger[object]
      : object
  }
}

if (typeof process === 'object') {
  if (typeof process.env.LOGGER_DEFAULT === 'string') {
    Logger.set('default', process.env.LOGGER_DEFAULT)
  }

  if (typeof process.env.LOGGER_REDIS === 'string') {
    Logger.get('redis').setClient(process.env.LOGGER_REDIS)
  }
}
