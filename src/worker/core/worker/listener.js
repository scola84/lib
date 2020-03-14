import isObject from 'lodash/isObject.js'
import isString from 'lodash/isString.js'
import { listener } from './listener/index.js'

export class Listener {
  static get (type = 'default') {
    return listener[type]
  }

  static set (type, object) {
    listener[type] = isObject(object) === true
      ? object
      : listener[object]
  }
}

if (isObject(process) === true) {
  if (isString(process.env.LISTENER_DEFAULT) === true) {
    Listener.set('default', process.env.LISTENER_DEFAULT)
  }

  if (isString(process.env.LISTENER_REDIS) === true) {
    Listener.get('redis').setClient(process.env.LISTENER_REDIS)
  }

  if (isString(process.env.LISTENER_HOSTNAME) === true) {
    Listener.get('redis').setClient(process.env.LISTENER_HOSTNAME)
  }
}
