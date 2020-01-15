import { listener } from './listener/index.js'

export class Listener {
  static get (type = 'default') {
    return listener[type]
  }

  static set (type, object) {
    listener[type] = typeof object === 'string'
      ? listener[object]
      : object
  }
}

if (typeof process === 'object') {
  if (typeof process.env.LISTENER_DEFAULT === 'string') {
    Listener.set('default', process.env.LISTENER_DEFAULT)
  }

  if (typeof process.env.LISTENER_REDIS === 'string') {
    Listener.get('redis').setClient(process.env.LISTENER_REDIS)
  }

  if (typeof process.env.LISTENER_HOSTNAME === 'string') {
    Listener.get('redis').setClient(process.env.LISTENER_HOSTNAME)
  }
}
