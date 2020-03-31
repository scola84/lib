import { MapCache } from './map.js'
import { MemcachedCache } from './memcached.js'
import { RedisCache } from './redis.js'
import { WindowCache } from './window.js'

export const cache = {
  local: new WindowCache(),
  map: new MapCache(),
  memcached: new MemcachedCache(),
  redis: new RedisCache(),
  session: new WindowCache()
}
