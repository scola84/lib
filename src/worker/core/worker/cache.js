import isObject from 'lodash/isObject.js'
import isString from 'lodash/isString.js'
import { cache } from './cache/index.js'

export class Cache {
  static get (type = 'default') {
    return cache[type]
  }

  static set (type, object) {
    cache[type] = isObject(object) === true
      ? object
      : cache[object]
  }
}

if (isObject(process) === true) {
  if (isString(process.env.CACHE_DEFAULT) === true) {
    Cache.set('default', process.env.CACHE_DEFAULT)
  }

  if (isString(process.env.CACHE_REDIS) === true) {
    Cache.get('redis').setClient(process.env.CACHE_REDIS)
  }

  if (isString(process.env.CACHE_MEMCACHED) === true) {
    Cache.get('memcached').setClient(process.env.CACHE_MEMCACHED)
  }
}
