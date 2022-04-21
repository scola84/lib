import { expect, request, use } from 'chai'
import { AuthLoginPostHandler } from '../../../../../../src/server/handlers/route/auth/login/post'
import type { Entities } from '../../../../../../src/server/entities'
import { PgsqlDatabase } from '../../../../../../src/server/helpers/sql/pgsql/database'
import type { RedisClientType } from 'redis'
import { RouteAuth } from '../../../../../../src/server/helpers/route/auth'
import { RouteCodec } from '../../../../../../src/server/helpers/route/codec'
import { Router } from '../../../../../../src/server/helpers/route/router'
import { SchemaValidator } from '../../../../../../src/server/helpers/schema/validator'
import { createClient } from '@node-redis/client'
import http from 'chai-http'
import { sql } from '../../../../../../src/server/helpers/sql/tag'
import { validators } from '../../../../../../src/server/validators'

use(http)

describe('AuthLoginPostHandler', () => {
  describe('should return 400 when the request', () => {
    it('has no body', hasNoBody)
  })
})

class Helpers {
  public auth: RouteAuth
  public codec: RouteCodec
  public database: PgsqlDatabase
  public handler: AuthLoginPostHandler
  public router: Router
  public store: RedisClientType
}

const helpers = new Helpers()

const population: Partial<Entities> = {
  user: [{
    user_id: 1,
    username: 'scola'
  }]
}

beforeAll(async () => {
  SchemaValidator.defineValidators(validators)

  helpers.database = new PgsqlDatabase({
    dsn: 'pgsql://root@127.0.0.1/scola',
    password: 'root',
    population: population
  })

  helpers.router = new Router({
    address: '127.0.0.1',
    port: 3000
  })

  helpers.store = createClient({
    url: 'redis://default:root@127.0.0.1:6379'
  })

  helpers.auth = new RouteAuth({
    backoffFactor: 0,
    database: helpers.database,
    store: helpers.store
  })

  helpers.codec = new RouteCodec({})

  helpers.handler = new AuthLoginPostHandler({
    auth: helpers.auth,
    codec: helpers.codec,
    database: helpers.database,
    router: helpers.router,
    store: helpers.store,
    url: '/api/auth/login'
  })

  helpers.handler.start()
  await helpers.database.start()
  await helpers.router.start()
  await helpers.store.connect()
})

afterEach(async () => {
  await truncateTables()
})

afterAll(async () => {
  await helpers.database.stop()
  await helpers.store.flushAll()
  await helpers.store.quit()
})

async function truncateTables (): Promise<void> {
  await Promise.all([
    helpers.database.update(sql`TRUNCATE $[group] CASCADE`),
    helpers.database.update(sql`TRUNCATE $[role] CASCADE`),
    helpers.database.update(sql`TRUNCATE $[user] CASCADE`)
  ])
}

async function hasNoBody (): Promise<void> {
  const response = await request(helpers.router.server)
    .post('/api/auth/login')

  expect(response.status).eq(400)

  expect(JSON.parse(response.text)).eql({
    body: {
      code: 'err_validator_value_missing'
    }
  })
}
