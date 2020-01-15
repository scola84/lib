import { cache } from './cache/index.js'

export class Cache {
  static get (type = 'default') {
    return cache[type]
  }

  static set (type, object) {
    cache[type] = typeof object === 'string'
      ? cache[object]
      : object
  }
}

if (typeof process === 'object') {
  if (typeof process.env.CACHE_DEFAULT === 'string') {
    Cache.set('default', process.env.CACHE_DEFAULT)
  }

  if (typeof process.env.CACHE_REDIS === 'string') {
    Cache.get('redis').setClient(process.env.CACHE_REDIS)
  }

  if (typeof process.env.CACHE_MEMCACHED === 'string') {
    Cache.get('memcached').setClient(process.env.CACHE_MEMCACHED)
  }
}
