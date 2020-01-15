import { LocalCache } from './local.js'
import { MapCache } from './map.js'
import { MemcachedCache } from './memcached.js'
import { RedisCache } from './redis.js'
import { SessionCache } from './session.js'

export const cache = {
  default: new MapCache(),
  local: new LocalCache(),
  map: new MapCache(),
  memcached: new MemcachedCache(),
  redis: new RedisCache(),
  session: new SessionCache()
}
