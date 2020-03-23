import { ConsoleLogger } from './console.js'
import { RedisLogger } from './redis.js'

export const logger = {
  devout: new ConsoleLogger(),
  prdout: new ConsoleLogger(),
  redis: new RedisLogger()
}
