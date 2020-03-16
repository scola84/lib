import isObject from 'lodash/isObject.js'
import isString from 'lodash/isString.js'
import { logger } from './logger/index.js'

export class Logger {
  static get (type = 'default') {
    return logger[type]
  }

  static set (type, object) {
    logger[type] = isObject(object) === true
      ? object
      : logger[object]
  }
}

Logger.set('default', 'prdout')
Logger.get('devout').setClient(console)
Logger.get('prdout').setClient(console)
Logger.get('prdout').setTypes('fail')

if (typeof process === 'object') {
  if (isString(process.env.LOGGER_DEFAULT) === true) {
    Logger.set('default', process.env.LOGGER_DEFAULT)
  }

  if (isString(process.env.LOGGER_REDIS) === true) {
    Logger.get('redis').setClient(process.env.LOGGER_REDIS)
  }
}
