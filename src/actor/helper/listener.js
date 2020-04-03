import isObject from 'lodash/isObject.js'
import isString from 'lodash/isString.js'
import { listener } from './listener/index.js'

export class Listener {
  static get (type = 'default') {
    return listener[type]
  }

  static set (type, object = 'redis') {
    listener[type] = isObject(object) === true
      ? object
      : listener[object]
  }
}

if (typeof process === 'object') {
  Listener.set('default', process.env.LISTENER_DEFAULT)

  if (isString(process.env.LISTENER_REDIS_CLIENT) === true) {
    Listener.get('redis').setClient(process.env.LISTENER_REDIS_CLIENT)
  }

  if (isString(process.env.LISTENER_HOSTNAME) === true) {
    Listener.get('redis').setClient(process.env.LISTENER_HOSTNAME)
  }
}
