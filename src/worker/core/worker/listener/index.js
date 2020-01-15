import { RedisListener } from './redis.js'

export const listener = {
  default: new RedisListener(),
  redis: new RedisListener()
}
