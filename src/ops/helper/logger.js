import isObject from 'lodash/isObject.js'
import isString from 'lodash/isString.js'
import { logger } from './logger/index.js'

export class Logger {
  static get (type = 'default') {
    return logger[type]
  }

  static set (type, object = 'console') {
    logger[type] = isObject(object) === true
      ? object
      : logger[object]
  }
}

if (typeof process === 'object') {
  Logger.set('default', process.env.LOGGER_DEFAULT)
  Logger.get('console').setClient(console)

  if (isString(process.env.LOGGER_REDIS) === true) {
    Logger.get('redis').setClient(process.env.LOGGER_REDIS)
  }
}

if (typeof window === 'object') {
  Logger.set('default', window.LOGGER_DEFAULT)
  Logger.get('console').setClient(console)
}
