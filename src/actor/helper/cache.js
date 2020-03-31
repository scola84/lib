import isObject from 'lodash/isObject.js'
import isString from 'lodash/isString.js'
import { cache } from './cache/index.js'

export class Cache {
  static get (type = 'default') {
    return cache[type]
  }

  static set (type, object = 'map') {
    cache[type] = isObject(object) === true
      ? object
      : cache[object]
  }
}

if (typeof process === 'object') {
  Cache.set('default', process.env.CACHE_DEFAULT)
  Cache.get('map').setClient(new Map())

  if (isString(process.env.CACHE_REDIS_CLIENT) === true) {
    Cache.get('redis').setClient(process.env.CACHE_REDIS_CLIENT)
  }

  if (isString(process.env.CACHE_MEMCACHED_CLIENT) === true) {
    Cache.get('memcached').setClient(process.env.CACHE_MEMCACHED_CLIENT)
  }

  Cache.get('map').setTtl(process.env.CACHE_TTL)
  Cache.get('memcached').setTtl(process.env.CACHE_TTL)
  Cache.get('redis').setTtl(process.env.CACHE_TTL)
}

if (typeof window === 'object') {
  Cache.set('default', window.CACHE_DEFAULT)

  Cache.get('local').setClient(window.localStorage)
  Cache.get('map').setClient(new Map())
  Cache.get('session').setClient(window.sessionStorage)

  Cache.get('local').setTtl(process.env.CACHE_TTL)
  Cache.get('map').setTtl(process.env.CACHE_TTL)
  Cache.get('session').setTtl(process.env.CACHE_TTL)
}
