import { ConsoleLogger } from './console.js'
import { RedisLogger } from './redis.js'

export const logger = {
  console: new ConsoleLogger(),
  redis: new RedisLogger()
}
