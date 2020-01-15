import { DevoutLogger } from './devout.js'
import { PrdoutLogger } from './prdout.js'
import { RedisLogger } from './redis.js'

export const logger = {
  default: new PrdoutLogger(),
  devout: new DevoutLogger(),
  prdout: new PrdoutLogger(),
  redis: new RedisLogger()
}
